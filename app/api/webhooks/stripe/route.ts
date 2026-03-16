import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'
import { sendOrderConfirmation } from '@/lib/emails'
import { sendOrderConfirmationWA } from '@/lib/whatsapp'
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

    // Separar productos normales de bordados
    // Los bordados NO van a order_items (inventory_id es UUID FK, no admite strings)
    // Sus detalles se guardan en orders.embroidery_notes
    const productItems  = compact.filter((i) => !i.inventory_id.startsWith('embroidery_'))
    const embroideryItems = compact.filter((i) => i.inventory_id.startsWith('embroidery_'))

    const client = createServiceClient()

    // Lookup de detalles solo para productos reales (evita error de tipo UUID en Postgres)
    const { data: inventoryRows } = await client
      .from('full_inventory_details')
      .select('inventory_id, product_id, product_name, color, size')
      .in('inventory_id', productItems.map((i) => i.inventory_id))

    const detailsMap = new Map(
      (inventoryRows ?? []).map((r) => [r.inventory_id, r])
    )

    const cart: CartItem[] = compact.map((i) => {
      if (i.inventory_id.startsWith('embroidery_')) {
        return {
          inventory_id: i.inventory_id,
          quantity:     i.quantity,
          price:        i.price,
          product_id:   'bordado',
          product_name: 'Bordado',
          color:        '',
          size:         '',
          variant_key:  '',
          stock:        0,
          image_url:    null,
          item_type:    'embroidery' as const,
        }
      }
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

    // Construir embroidery_notes desde metadata.bordados
    // Formato legible para el admin: una línea por bordado
    type BordadoMeta = { id: string; t: string; l: string; n: string | null; c: string | null }
    let embroidery_notes: string | null = null
    if (embroideryItems.length > 0 && metadata.bordados) {
      try {
        const arr = JSON.parse(metadata.bordados) as BordadoMeta[]
        const lines = arr.map((b, idx) =>
          b.t === 'logo'
            ? `Bordado ${idx + 1}: Logo | ${b.l}`
            : `Bordado ${idx + 1}: Nombre "${b.n}" | ${b.l} | Hilo ${b.c}`
        )
        embroidery_notes = lines.join('\n')
      } catch (e) {
        console.error('Error parsing bordados metadata:', e)
        // Fallback: al menos dejar constancia de cuántos bordados hay
        embroidery_notes = `${embroideryItems.length} bordado(s) — ver detalles en Stripe`
      }
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = Math.max(0, subtotal - discount_amount) + shipping_amount

    // Crear orden — embroidery_notes ya existe en la tabla orders
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
        ...(embroidery_notes ? { embroidery_notes } : {}),
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }

    const orderId = order.id

    // Insertar solo productos reales en order_items (bordados van en orders.embroidery_notes)
    if (productItems.length > 0) {
      const { error: itemsError } = await client
        .from('order_items')
        .insert(productItems.map((item) => ({
          order_id:      orderId,
          inventory_id:  item.inventory_id,
          quantity:      item.quantity,
          price_at_sale: item.price,
        })))

      if (itemsError) {
        console.error('Order items insert failed:', itemsError)
        return NextResponse.json({ error: 'Items insert failed' }, { status: 500 })
      }
    }

    // Incrementar uso del código de descuento
    if (discount_code) {
      await client.rpc('increment_coupon_uses', { p_code: discount_code })
    }

    // Reducir stock solo para productos reales
    for (const item of productItems) {
      const { error } = await client.rpc('decrement_stock', {
        p_inventory_id: item.inventory_id,
        p_quantity:     item.quantity,
      })
      if (error) console.error(`Stock decrement failed for ${item.inventory_id}:`, error)
    }

    // Enviar email de confirmación
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
        console.error('Confirmation email failed:', emailErr)
      }
    }

    // Enviar WhatsApp de confirmación
    if (customer_phone) {
      try {
        await sendOrderConfirmationWA({
          phone:          customer_phone,
          customer_name,
          order_id:       orderId,
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
      } catch (waErr) {
        console.error('WhatsApp confirmation failed:', waErr)
      }
    }

    console.log(`✓ Order ${orderId} created from session ${session.id}`)
    if (embroidery_notes) console.log(`  Bordados:\n${embroidery_notes}`)
  }

  return NextResponse.json({ received: true })
}
