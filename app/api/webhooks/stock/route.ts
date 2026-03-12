import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendBackInStockEmail } from '@/lib/emails'

// Supabase Database Webhook — se dispara cuando cambia stock en la tabla inventory
// Configurar en: Supabase → Database → Webhooks → Create Webhook
// Tabla: inventory | Evento: UPDATE | URL: https://tu-dominio.com/api/webhooks/stock

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, record, old_record } = body

  if (type !== 'UPDATE') return NextResponse.json({ ok: true })

  // Solo nos interesa cuando stock sube de 0 a algo (reposición)
  const wasOOS  = (old_record?.stock ?? 0) <= 0
  const nowInStock = (record?.stock ?? 0) > 0
  if (!wasOOS || !nowInStock) return NextResponse.json({ ok: true })

  const inventoryId = record?.id ?? record?.inventory_id
  if (!inventoryId) return NextResponse.json({ ok: true })

  const client = createServiceClient()

  // Obtener info del producto desde la vista
  const { data: viewRow } = await client
    .from('full_inventory_details')
    .select('product_id, product_name, color')
    .eq('inventory_id', inventoryId)
    .single()

  if (!viewRow) return NextResponse.json({ ok: true })

  // Buscar suscriptores que esperan este producto + color
  const { data: notifications } = await client
    .from('stock_notifications')
    .select('id, email')
    .eq('product_id', viewRow.product_id)
    .eq('color', viewRow.color)
    .is('notified_at', null)

  if (!notifications || notifications.length === 0) return NextResponse.json({ ok: true })

  // Enviar email a cada suscriptor
  for (const notif of notifications) {
    try {
      await sendBackInStockEmail({
        to:           notif.email,
        product_name: viewRow.product_name,
        color:        viewRow.color,
        product_id:   viewRow.product_id,
      })
      await client
        .from('stock_notifications')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', notif.id)
    } catch (err) {
      console.error('Back in stock email failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
