import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// GET /api/pedido?id=XXXXXXXX  — búsqueda pública por número de pedido
export async function GET(req: NextRequest) {
  const shortId = req.nextUrl.searchParams.get('id')?.trim()

  if (!shortId || shortId.length < 6) {
    return NextResponse.json({ error: 'Número de pedido inválido' }, { status: 400 })
  }

  const client = createServiceClient()

  // Buscar pedido cuyo UUID empiece con el shortId via RPC
  const { data: orders, error } = await client
    .rpc('get_order_by_short_id', { short_id: shortId.toLowerCase() })

  if (error) {
    return NextResponse.json({ error: 'Error al buscar el pedido' }, { status: 500 })
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  const order = orders[0]

  // Solo devolvemos lo que el cliente necesita ver (sin datos sensibles)
  return NextResponse.json({
    id:               order.id.slice(0, 8).toUpperCase(),
    created_at:       order.created_at,
    status:           order.status,
    total:            order.total,
    items:            order.items ?? [],
    delivery_method:  order.delivery_method ?? 'pickup',
    delivery_address: order.delivery_address ?? null,
  })
}
