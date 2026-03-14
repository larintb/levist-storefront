import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'
import { sendWhatsAppText } from '@/lib/whatsapp'

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

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as {
    phones?: string[]      // números manuales
    all_contacts?: boolean // enviar a todos los contactos guardados
    message: string
  }
  const { message, all_contacts } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Se requiere un mensaje.' }, { status: 400 })
  }

  let phones: string[] = body.phones ?? []

  // Si se pide enviar a todos los contactos guardados, los cargamos
  if (all_contacts) {
    const client = createServiceClient()
    const { data, error } = await client
      .from('whatsapp_contacts')
      .select('phone')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    phones = (data ?? []).map(c => c.phone)
  }

  phones = [...new Set(phones.map(p => p.trim()).filter(Boolean))]

  if (phones.length === 0) {
    return NextResponse.json({ error: 'No hay números a quién enviar.' }, { status: 400 })
  }

  let sent = 0
  const failed: string[] = []

  for (const phone of phones) {
    try {
      await sendWhatsAppText(phone, message)
      sent++
    } catch (err) {
      console.error(`WhatsApp failed for ${phone}:`, err)
      failed.push(phone)
    }
    // Delay de 1.5s entre mensajes para no ser marcado como spam
    if (phones.indexOf(phone) < phones.length - 1) {
      await delay(1500)
    }
  }

  return NextResponse.json({ sent, failed })
}
