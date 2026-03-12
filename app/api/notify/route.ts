import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email: string
    product_id: string
    product_name: string
    color: string
    size?: string
  }

  const { email, product_id, product_name, color, size } = body

  if (!email || !product_id || !color) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 })
  }

  const client = createServiceClient()

  const { error } = await client
    .from('stock_notifications')
    .upsert(
      { email, product_id, product_name, color, size: size ?? null },
      { onConflict: 'email,product_id,color', ignoreDuplicates: true }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
