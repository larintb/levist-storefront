import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json() as { code: string; subtotal: number }

  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const client = createServiceClient()
  const now = new Date()

  const { data, error } = await client
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Código no válido' }, { status: 404 })
  }

  if (data.valid_from && now < new Date(data.valid_from)) {
    return NextResponse.json({ error: 'Este código aún no está activo' }, { status: 400 })
  }

  if (data.valid_until && now > new Date(data.valid_until)) {
    return NextResponse.json({ error: 'Este código ha expirado' }, { status: 400 })
  }

  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ error: 'Este código ya no tiene usos disponibles' }, { status: 400 })
  }

  const discount_amount =
    data.discount_type === 'percentage'
      ? Math.round((subtotal * data.discount_value) / 100 * 100) / 100
      : Math.min(Number(data.discount_value), subtotal)

  return NextResponse.json({
    valid: true,
    code: data.code,
    discount_type: data.discount_type,
    discount_value: Number(data.discount_value),
    discount_amount,
  })
}
