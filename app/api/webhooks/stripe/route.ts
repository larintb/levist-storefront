import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { sendOrderConfirmation } from '@/lib/emails'
import type { CartItem } from '@/types/product'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata
    if (!metadata) return NextResponse.json({ error: 'No metadata' }, { status: 400 })

    const customer_name    = metadata.customer_name
    const customer_phone   = metadata.customer_phone
    const customer_email   = metadata.customer_email ?? session.customer_details?.email ?? ''
    const delivery_method  = (metadata.delivery_method ?? 'pickup') as 'pickup' | 'delivery'
    const delivery_address = metadata.delivery_address
    const discount_code    = metadata.discount_code ?? null
    const discount_amount  = metadata.discount_amount ? Number(metadata.discount_amount) : 0
    const shipping_amount  = metadata.shipping_amount ? Number(metadata.shipping_amount) : 0

    // Compact cart format: "inventory_id:qty:price|..."
    type CompactItem = { inventory_id: string; quantity: number; price: number }
    let compact: CompactItem[] = []
    try {
      compact = (metadata.cart ?? '').split('|').map((segment) => {
        const [inventory_id, qty, price] = segment.split(':')
        return { inventory_id, quantity: Number(qty), price: Number(price) }
      })
      if (compact.some((i) => !i.inventory_id || isNaN(i.quantity) || isNaN(i.price))) {
        throw new Error('Malformed cart segment')
      }
    } catch (err) {
      console.error('Cart parse error:', err, 'raw:', metadata.cart)
      return NextResponse.json({ error: 'Invalid cart metadata' }, { status: 400 })
    }

    const client = createServiceClient()

    // Look up product details for confirmation email
    const { data: inventoryRows } = await client
      .from('full_inventory_details')
      .select('inventory_id, product_id, product_name, color, size')
      .in('inventory_id', compact.map((i) => i.inventory_id))

    const detailsMap = new Map(
      (inventoryRows ?? []).map((r) => [r.inventory_id, r])
    )

    const cart: CartItem[] = compact.map((i) => {
      const detail = detailsMap.get(i.inventory_id)
      return {
        inventory_id: i.inventory_id,
        quantity:     i.quantity,
        price:        i.price,
        product_id:   detail?.product_id ?? '',
        product_name: detail?.product_name ?? i.inventory_id,
        color:        detail?.color ?? '',
        size:         detail?.size ?? '',
        variant_key:  '',
        stock:        0,
        image_url:    null,
      }
    })

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = Math.max(0, subtotal - discount_amount) + shipping_amount

    // Crear orden
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        customer_name,
        customer_phone,
        customer_email,
        payment_method: 'stripe',
        status: 'paid',
        subtotal,
        discount_amount,
        discount_code,
        total,
        user_id: null,
        school_id: null,
        delivery_method,
        delivery_address: delivery_address ?? null,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    const orderId = order.id

    // Insertar artículos
    const { error: itemsError } = await client
      .from('order_items')
      .insert(cart.map((item) => ({
        order_id:       orderId,
        inventory_id:   item.inventory_id,
        quantity:       item.quantity,
        price_at_sale:  item.price,
      })))

    if (itemsError) {
      console.error('Order items insert failed:', itemsError)
      return NextResponse.json({ error: 'Items insert failed' }, { status: 500 })
    }

    // Incrementar uso del código de descuento
    if (discount_code) {
      await client.rpc('increment_coupon_uses', { p_code: discount_code })
    }

    // Reducir stock
    for (const item of cart) {
      const { error } = await client.rpc('decrement_stock', {
        p_inventory_id: item.inventory_id,
        p_quantity:     item.quantity,
      })
      if (error) console.error(`Stock decrement failed for ${item.inventory_id}:`, error)
    }

    // Enviar email de confirmación si hay dirección
    if (customer_email) {
      try {
        await sendOrderConfirmation({
          to:            customer_email,
          customer_name,
          order_id:      orderId,
          items: cart.map((i) => ({
            product_name:  i.product_name,
            color:         i.color,
            size:          i.size,
            quantity:      i.quantity,
            price_at_sale: i.price,
          })),
          total,
          delivery_method,
          delivery_address,
        })
      } catch (emailErr) {
        // No-fatal: loguear pero no fallar el webhook
        console.error('Confirmation email failed:', emailErr)
      }
    }

    console.log(`✓ Order ${orderId} created from session ${session.id}`)
  }

  return NextResponse.json({ received: true })
}
