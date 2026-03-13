import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'
import { sendOrderReady, sendOrderDelivered, sendOrderCancelled } from '@/lib/emails'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id: orderId } = await params
  const body = await req.json() as { status: string; custom_message?: string }
  const { status, custom_message } = body

  const validStatuses = ['paid', 'ready', 'shipped', 'picked_up', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const client = createServiceClient()

  const { data: order, error: fetchError } = await client
    .from('orders')
    .select('id, customer_name, customer_email, status, delivery_method, delivery_address')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const { error: updateError } = await client
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Email: listo para recoger / en camino
  if ((status === 'ready' || status === 'shipped') && order.customer_email) {
    try {
      await sendOrderReady({
        to:              order.customer_email,
        customer_name:   order.customer_name,
        order_id:        orderId,
        delivery_method: (order.delivery_method ?? 'pickup') as 'pickup' | 'delivery',
        custom_message:  custom_message || undefined,
      })
    } catch (emailErr) {
      console.error('Ready email failed:', emailErr)
    }
  }

  // Email: pedido completado / entregado
  if (status === 'picked_up' && order.customer_email) {
    try {
      await sendOrderDelivered({
        to:              order.customer_email,
        customer_name:   order.customer_name,
        order_id:        orderId,
        delivery_method: (order.delivery_method ?? 'pickup') as 'pickup' | 'delivery',
      })
    } catch (emailErr) {
      console.error('Delivered email failed:', emailErr)
    }
  }

  // Email: pedido cancelado
  if (status === 'cancelled' && order.customer_email) {
    try {
      await sendOrderCancelled({
        to:            order.customer_email,
        customer_name: order.customer_name,
        order_id:      orderId,
      })
    } catch (emailErr) {
      console.error('Cancellation email failed:', emailErr)
    }
  }

  return NextResponse.json({ success: true, status })
}
