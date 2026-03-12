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

// GET — listar contactos
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const client = createServiceClient()
  const { data, error } = await client
    .from('marketing_contacts')
    .select('id, email, name, created_at, active')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacts: data ?? [] })
}

// POST — agregar / importar correos
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as { emails: string[]; name?: string }
  const { emails } = body

  if (!emails || emails.length === 0) {
    return NextResponse.json({ error: 'Sin correos' }, { status: 400 })
  }

  // Normalizar y deduplicar
  const rows = [...new Set(
    emails.map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))
  )].map(email => ({ email }))

  const client = createServiceClient()
  const { data, error } = await client
    .from('marketing_contacts')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: true })
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ added: data?.length ?? 0 })
}

// DELETE — eliminar contacto por id
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json() as { id: string }
  const client = createServiceClient()
  const { error } = await client.from('marketing_contacts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
