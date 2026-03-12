import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET — listar códigos
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const client = createServiceClient()
  const { data, error } = await client
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data ?? [] })
}

// POST — crear código
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as {
    code: string
    discount_type: 'percentage' | 'fixed'
    discount_value: number
    valid_from?: string
    valid_until?: string
    max_uses?: number
  }

  const { code, discount_type, discount_value, valid_from, valid_until, max_uses } = body

  if (!code || !discount_type || !discount_value) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (discount_type === 'percentage' && (discount_value <= 0 || discount_value > 100)) {
    return NextResponse.json({ error: 'El porcentaje debe ser entre 1 y 100' }, { status: 400 })
  }

  const client = createServiceClient()
  const { data, error } = await client
    .from('discount_codes')
    .insert({
      code: code.toUpperCase().trim(),
      discount_type,
      discount_value,
      valid_from:  valid_from  || null,
      valid_until: valid_until || null,
      max_uses:    max_uses    || null,
    })
    .select()
    .single()

  if (error) {
    const msg = error.code === '23505' ? 'Ya existe un código con ese nombre' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }
  return NextResponse.json({ code: data })
}

// PATCH — activar/desactivar
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, active } = await req.json() as { id: string; active: boolean }
  const client = createServiceClient()
  const { error } = await client.from('discount_codes').update({ active }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — eliminar código
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json() as { id: string }
  const client = createServiceClient()
  const { error } = await client.from('discount_codes').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
