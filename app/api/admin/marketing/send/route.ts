import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'
import { getResend, FROM_EMAIL } from '@/lib/resend'

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

function buildHtml(subject: string, heading: string, message: string, cta_text?: string, cta_url?: string) {
  const paragraphs = message
    .split('\n')
    .filter(l => l.trim())
    .map(l => `<p style="color:#374151; font-size:14px; line-height:1.8; margin:0 0 16px;">${l}</p>`)
    .join('')

  const ctaBlock = cta_text && cta_url ? `
    <div style="margin:32px 0;">
      <a href="${cta_url}" target="_blank"
         style="display:inline-block; background:#000000; color:#ffffff; padding:14px 32px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; text-decoration:none;">
        ${cta_text} →
      </a>
    </div>` : ''

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.1);">

        <!-- Header -->
        <div style="background:#000000; padding:32px 40px; display:flex; align-items:center; justify-content:space-between;">
          <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:900; font-style:italic; letter-spacing:-1px;">LEVIST</h1>
          <span style="color:#facc15; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px;">Uniformes</span>
        </div>

        <!-- Barra amarilla -->
        <div style="height:4px; background:#facc15;"></div>

        <div style="padding:40px;">

          <!-- Heading -->
          <h2 style="font-size:26px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 24px; color:#111; line-height:1.2;">
            ${heading}
          </h2>

          <!-- Mensaje -->
          <div style="margin-bottom:8px;">
            ${paragraphs}
          </div>

          ${ctaBlock}

          <!-- Separador -->
          <div style="border-top:1px solid #f3f4f6; margin:32px 0;"></div>

          <!-- Tienda -->
          <p style="margin:0; font-size:13px; color:#9ca3af; line-height:1.6;">
            Visita nuestra tienda en
            <a href="https://levist.mx/catalogo" style="color:#111; font-weight:700; text-decoration:none;">levist.mx</a>
          </p>

        </div>

        <!-- Footer -->
        <div style="background:#111111; padding:28px 40px;">
          <p style="color:#4b5563; font-size:11px; margin:0 0 6px; text-transform:uppercase; letter-spacing:1px;">
            LEVIST Uniformes · Matamoros, Tamaulipas
          </p>
          <p style="color:#374151; font-size:11px; margin:0;">
            Recibiste este correo porque eres parte de nuestra lista de clientes.
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as {
    subject: string
    heading: string
    message: string
    cta_text?: string
    cta_url?: string
    test_email?: string   // si viene, solo manda a este email (preview)
  }

  const { subject, heading, message, cta_text, cta_url, test_email } = body

  if (!subject || !heading || !message) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const html = buildHtml(subject, heading, message, cta_text, cta_url)
  const resend = getResend()

  // — Envío de prueba —
  if (test_email) {
    await resend.emails.send({ from: FROM_EMAIL, to: test_email, subject: `[PRUEBA] ${subject}`, html })
    return NextResponse.json({ success: true, sent: 1, test: true })
  }

  // — Envío masivo —
  const client = createServiceClient()
  const { data: contacts, error } = await client
    .from('marketing_contacts')
    .select('email')
    .eq('active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ error: 'No hay contactos activos' }, { status: 400 })
  }

  // Resend permite max 100 por batch — dividir en chunks
  const CHUNK = 100
  let sent = 0

  for (let i = 0; i < contacts.length; i += CHUNK) {
    const chunk = contacts.slice(i, i + CHUNK)
    const batch = chunk.map(c => ({
      from: FROM_EMAIL,
      to:   c.email,
      subject,
      html,
    }))
    await resend.batch.send(batch)
    sent += chunk.length
  }

  return NextResponse.json({ success: true, sent })
}
