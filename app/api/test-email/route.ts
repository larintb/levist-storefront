import { NextRequest, NextResponse } from 'next/server'
import { getResend, FROM_EMAIL } from '@/lib/resend'

// Ruta temporal de diagnóstico — GET /api/test-email?to=tucorreo@ejemplo.com
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')
  if (!to) return NextResponse.json({ error: 'Falta ?to=email' }, { status: 400 })

  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Test LEVIST Resend',
      html: '<p>Si recibes esto, <strong>Resend está funcionando correctamente.</strong></p>',
    })
    return NextResponse.json({ ok: true, result, from: FROM_EMAIL })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      from: FROM_EMAIL,
    }, { status: 500 })
  }
}
