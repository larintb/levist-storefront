import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendOrderReady } from '@/lib/emails'

function checkAdminSecret(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  const provided = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret')
  return !secret || provided === secret
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminSecret(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id: orderId } = await params
  const { status } = await req.json() as { status: string }

  const validStatuses = ['paid', 'ready', 'picked_up', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const client = createServiceClient()

  // Obtener la orden antes de actualizar (necesitamos email y nombre)
  const { data: order, error: fetchError } = await client
    .from('orders')
    .select('id, customer_name, customer_email, status')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  // Actualizar estado
  const { error: updateError } = await client
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Si cambia a "ready" → enviar email de "listo para recoger"
  if (status === 'ready' && order.customer_email) {
    try {
      await sendOrderReady({
        to:            order.customer_email,
        customer_name: order.customer_name,
        order_id:      orderId,
      })
    } catch (emailErr) {
      console.error('Ready email failed:', emailErr)
      // No-fatal
    }
  }

  return NextResponse.json({ success: true, status })
}
