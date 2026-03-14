import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook receptor de Whapi.cloud
 * Whapi envía aquí eventos de mensajes entrantes y actualizaciones de estado.
 * Por ahora solo hacemos ACK (200) para que Whapi no reintente.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log('[Whapi webhook]', JSON.stringify(payload, null, 2))
    // TODO: manejar mensajes entrantes si se necesita en el futuro
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
