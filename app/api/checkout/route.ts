import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { CartItem } from '@/types/product'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cart, customer_name, customer_phone, customer_email, delivery_method, delivery_address, coupon_code, discount_amount, shipping_amount } = body as {
      cart: CartItem[]
      customer_name: string
      customer_phone: string
      customer_email: string
      delivery_method?: string
      delivery_address?: string
      coupon_code?: string
      discount_amount?: number
      shipping_amount?: number
    }

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    const stripe = getStripe()
    const origin =
      req.headers.get('origin') ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000'

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item) => {
      const isEmbroidery = item.item_type === 'embroidery'
      const description = isEmbroidery
        ? item.embroidery?.tipo === 'logo'
          ? `Logo · ${item.embroidery.lugar}`
          : `${item.embroidery?.nombre} · ${item.embroidery?.lugar} · ${item.embroidery?.colorHilo}`
        : `${item.color} – Talla ${item.size}`
      return {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: isEmbroidery ? 'Bordado Personalizado' : item.product_name,
            description,
            ...(item.image_url ? { images: [item.image_url] } : {}),
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }
    })

    // Envío como shipping_option (forma nativa de Stripe, no como line item)
    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
      shipping_amount && shipping_amount > 0
        ? [{
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: Math.round(shipping_amount * 100), currency: 'mxn' },
              display_name: 'Envío a domicilio',
            },
          }]
        : []

    // Apply coupon discount via Stripe
    let stripeCouponId: string | undefined
    if (coupon_code && discount_amount && discount_amount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discount_amount * 100),
        currency: 'mxn',
        duration: 'once',
        name: `Descuento: ${coupon_code}`,
      })
      stripeCouponId = stripeCoupon.id
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer_email || undefined,
      ...(shippingOptions.length > 0 ? { shipping_options: shippingOptions } : {}),
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      metadata: {
        customer_name,
        customer_phone,
        customer_email,
        delivery_method: delivery_method ?? 'pickup',
        ...(delivery_address ? { delivery_address } : {}),
        ...(coupon_code ? { discount_code: coupon_code } : {}),
        ...(discount_amount ? { discount_amount: String(discount_amount) } : {}),
        ...(shipping_amount && shipping_amount > 0 ? { shipping_amount: String(shipping_amount) } : {}),
        // Compact format: "inventory_id:qty:price" joined by "|" — stays well under 500-char Stripe limit
        cart: cart.map((i) => `${i.inventory_id}:${i.quantity}:${i.price}`).join('|'),
        // Detalles de bordados como JSON compacto (solo si hay bordados en el carrito)
        ...(cart.some((i) => i.item_type === 'embroidery') ? {
          bordados: JSON.stringify(
            cart
              .filter((i) => i.item_type === 'embroidery')
              .map((i) => ({
                id:  i.inventory_id,
                t:   i.embroidery?.tipo,
                l:   i.embroidery?.lugar,
                n:   i.embroidery?.nombre    ?? null,
                c:   i.embroidery?.colorHilo ?? null,
              }))
          ),
        } : {}),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      locale: 'es',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
