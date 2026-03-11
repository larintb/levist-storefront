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
    const { cart, customer_name, customer_phone, customer_email, delivery_method, delivery_address } = body as {
      cart: CartItem[]
      customer_name: string
      customer_phone: string
      customer_email: string
      delivery_method?: string
      delivery_address?: string
    }

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    const stripe = getStripe()
    const origin =
      req.headers.get('origin') ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000'

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.map((item) => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.product_name,
          description: `${item.color} – Talla ${item.size}`,
          ...(item.image_url ? { images: [item.image_url] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customer_email || undefined,
      metadata: {
        customer_name,
        customer_phone,
        customer_email,
        delivery_method: delivery_method ?? 'pickup',
        ...(delivery_address ? { delivery_address } : {}),
        // Compact format: "inventory_id:qty:price" joined by "|" — stays well under 500-char Stripe limit
        cart: cart.map((i) => `${i.inventory_id}:${i.quantity}:${i.price}`).join('|'),
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
