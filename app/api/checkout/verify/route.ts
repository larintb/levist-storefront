import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(key, { apiVersion: '2026-02-25.clover' })
}

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const stripe  = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const paid = session.status === 'complete' &&
      (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')

    if (!paid) {
      return NextResponse.json({ status: session.status, payment_status: session.payment_status })
    }

    const metadata       = session.metadata ?? {}
    const customer_email = metadata.customer_email ?? session.customer_details?.email ?? null
    const customer_name  = metadata.customer_name  ?? null
    const delivery_method = (metadata.delivery_method ?? 'pickup') as 'pickup' | 'delivery'
    const delivery_address = metadata.delivery_address ?? null

    // Parse cart from compact metadata: "inv_id:qty:price|..."
    type CompactItem = { inventory_id: string; quantity: number; price: number }
    const compact: CompactItem[] = (metadata.cart ?? '').split('|').map((seg: string) => {
      const [inventory_id, qty, price] = seg.split(':')
      return { inventory_id, quantity: Number(qty), price: Number(price) }
    }).filter((i: CompactItem) => i.inventory_id && !isNaN(i.quantity) && !isNaN(i.price))

    const supabase = createServiceClient()

    // Fetch product details for each inventory_id
    const { data: invRows } = await supabase
      .from('full_inventory_details')
      .select('inventory_id, product_name, color, size, product_image')
      .in('inventory_id', compact.map(i => i.inventory_id))

    const detailMap = new Map((invRows ?? []).map((r: {
      inventory_id: string; product_name: string; color: string; size: string; product_image: string | null
    }) => [r.inventory_id, r]))

    const items = compact.map(i => {
      const d = detailMap.get(i.inventory_id)
      return {
        inventory_id: i.inventory_id,
        product_name: d?.product_name ?? '—',
        color:        d?.color        ?? '—',
        size:         d?.size         ?? '—',
        image_url:    d?.product_image ?? null,
        quantity:     i.quantity,
        price:        i.price,
        subtotal:     i.quantity * i.price,
      }
    })

    const items_total    = items.reduce((s, i) => s + i.subtotal, 0)
    const discount_amount = metadata.discount_amount ? Number(metadata.discount_amount) : 0
    const total           = Math.max(0, items_total - discount_amount)

    // Try to find the order_id in Supabase (webhook may have a small delay)
    let order_id: string | null = null
    if (customer_email) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', customer_email)
        .eq('payment_method', 'stripe')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      order_id = order?.id ?? null
    }

    return NextResponse.json({
      status:          'complete',
      payment_status:  session.payment_status,
      customer_name,
      customer_email,
      delivery_method,
      delivery_address,
      items,
      items_total,
      discount_amount,
      total,
      order_id,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }
}
