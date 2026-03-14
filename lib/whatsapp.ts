import { createServiceClient } from '@/lib/supabase'

const WHAPI_BASE = 'https://gate.whapi.cloud'

function getWhapiToken() {
  const token = process.env.WHAPI_TOKEN
  if (!token) throw new Error('Missing WHAPI_TOKEN')
  return token
}

/**
 * Normaliza un número a formato internacional sin '+'.
 *
 * México  (+52): 52 + 10 dígitos = 12 dígitos  → ej. 528681234567
 * EE.UU.  (+1) : 1  + 10 dígitos = 11 dígitos  → ej. 12125551234
 *
 * Entradas aceptadas:
 *   8681234567      → 528681234567   (MX, 10 dígitos, asume México)
 *   528681234567    → sin cambio     (MX, ya correcto)
 *   521XXXXXXXXXX   → 52XXXXXXXXXX   (MX, quita el '1' sobrante)
 *   +528681234567   → 528681234567   (elimina el +)
 *   2125551234      → 12125551234    (US, 10 dígitos)
 *   12125551234     → sin cambio     (US, ya correcto)
 *   +12125551234    → 12125551234    (elimina el +)
 */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  // MX ya correcto: 52 + 10 dígitos
  if (digits.startsWith('52') && digits.length === 12) return digits

  // MX con '1' extra (521XXXXXXXXXX → 52XXXXXXXXXX)
  if (digits.startsWith('521') && digits.length === 13) return '52' + digits.slice(3)

  // US/CA ya correcto: 1 + 10 dígitos
  if (digits.startsWith('1') && digits.length === 11) return digits

  // 10 dígitos: detecta si es US (NPA empieza en 2-9 y no es área MX típica)
  if (digits.length === 10) {
    // Áreas US: NPA válido (200-999) y NXX válido (200-999)
    const looksUS = /^[2-9][0-9]{2}[2-9][0-9]{6}$/.test(digits)
    return looksUS ? '1' + digits : '52' + digits
  }

  return digits
}

// ─── Logging ──────────────────────────────────────────────────────────────────

async function logWA(params: {
  original_phone: string
  to_phone: string
  message: string
  status: 'sent' | 'failed'
  error?: string
}) {
  try {
    const client = createServiceClient()
    await client.from('whatsapp_logs').insert({
      original_phone: params.original_phone,
      to_phone:       params.to_phone,
      message:        params.message.slice(0, 1000), // máx 1000 chars en DB
      status:         params.status,
      error:          params.error ?? null,
    })
  } catch (e) {
    // No-fatal: no queremos que el log rompa el flujo principal
    console.error('[whatsapp_logs] insert failed:', e)
  }
}

// ─── Envío base ───────────────────────────────────────────────────────────────

const fmt = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

/** Envía un mensaje de texto plano por WhatsApp y registra el intento. */
export async function sendWhatsAppText(phone: string, body: string): Promise<void> {
  const token    = getWhapiToken()
  const to       = formatPhone(phone)

  let errorMsg: string | undefined

  try {
    const res = await fetch(`${WHAPI_BASE}/messages/text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, body }),
    })

    if (!res.ok) {
      const err = await res.text()
      errorMsg = `HTTP ${res.status}: ${err}`
      await logWA({ original_phone: phone, to_phone: to, message: body, status: 'failed', error: errorMsg })
      throw new Error(`Whapi error ${res.status}: ${err}`)
    }
  } catch (e) {
    if (!errorMsg) {
      errorMsg = e instanceof Error ? e.message : String(e)
      await logWA({ original_phone: phone, to_phone: to, message: body, status: 'failed', error: errorMsg })
    }
    throw e
  }

  await logWA({ original_phone: phone, to_phone: to, message: body, status: 'sent' })
}

// ─── Notificaciones de pedido ─────────────────────────────────────────────────

interface OrderItem {
  product_name: string
  color: string
  size: string
  quantity: number
  price_at_sale: number
}

interface WAOrderConfirmationParams {
  phone: string
  customer_name: string
  order_id: string
  items: OrderItem[]
  total: number
  delivery_method: 'pickup' | 'delivery'
  delivery_address?: string
}

export async function sendOrderConfirmationWA(params: WAOrderConfirmationParams) {
  const { phone, customer_name, order_id, items, total, delivery_method, delivery_address } = params
  const shortId = order_id.slice(0, 8).toUpperCase()

  const itemLines = items
    .map(i => `  • ${i.product_name} (${i.color}, T.${i.size}) ×${i.quantity} — ${fmt(i.price_at_sale * i.quantity)}`)
    .join('\n')

  const deliveryLine =
    delivery_method === 'pickup'
      ? '📍 *Recoger en tienda:* Caracol 10, Acuario 2001, Matamoros, Tamps.'
      : `🚚 *Envío a domicilio:* ${delivery_address ?? '—'}`

  const body =
    `✅ *¡Pedido confirmado, ${customer_name}!*\n\n` +
    `Número de pedido: *#${shortId}*\n\n` +
    `🧾 *Resumen:*\n${itemLines}\n\n` +
    `*Total pagado: ${fmt(total)}*\n\n` +
    `${deliveryLine}\n\n` +
    `Te avisaremos cuando tu pedido esté listo. ¡Gracias por comprar en LEVIST! 💛`

  await sendWhatsAppText(phone, body)
}

interface WAOrderReadyParams {
  phone: string
  customer_name: string
  order_id: string
  delivery_method: 'pickup' | 'delivery'
  custom_message?: string
}

export async function sendOrderReadyWA(params: WAOrderReadyParams) {
  const { phone, customer_name, order_id, delivery_method, custom_message } = params
  const shortId  = order_id.slice(0, 8).toUpperCase()
  const isDelivery = delivery_method === 'delivery'

  const headline = isDelivery
    ? `📦 *¡Tu pedido está en camino, ${customer_name}!*`
    : `🎉 *¡Tu pedido está listo, ${customer_name}!*`

  const detail = isDelivery
    ? 'Pronto lo recibirás en tu domicilio.'
    : 'Ya puedes pasar a recogerlo a nuestra tienda.\n📍 Caracol 10, Acuario 2001, Matamoros, Tamps.'

  const customLine = custom_message ? `\n💬 _${custom_message}_` : ''

  const body =
    `${headline}\n\n` +
    `Pedido: *#${shortId}*\n\n` +
    `${detail}${customLine}\n\n` +
    `¡Gracias por confiar en LEVIST! 💛`

  await sendWhatsAppText(phone, body)
}

interface WAOrderDeliveredParams {
  phone: string
  customer_name: string
  order_id: string
}

export async function sendOrderDeliveredWA(params: WAOrderDeliveredParams) {
  const { phone, customer_name, order_id } = params
  const shortId = order_id.slice(0, 8).toUpperCase()

  const body =
    `✅ *¡Pedido completado, ${customer_name}!*\n\n` +
    `Tu pedido *#${shortId}* ha sido entregado exitosamente.\n\n` +
    `Esperamos que disfrutes tu compra. ¡Gracias por elegir LEVIST! 💛`

  await sendWhatsAppText(phone, body)
}

interface WAOrderCancelledParams {
  phone: string
  customer_name: string
  order_id: string
}

export async function sendOrderCancelledWA(params: WAOrderCancelledParams) {
  const { phone, customer_name, order_id } = params
  const shortId = order_id.slice(0, 8).toUpperCase()

  const body =
    `❌ *Pedido cancelado — #${shortId}*\n\n` +
    `Hola ${customer_name}, tu pedido ha sido cancelado.\n\n` +
    `Si realizaste el pago con tarjeta, el reembolso se procesará en los próximos días hábiles.\n\n` +
    `¿Tienes dudas? Escríbenos aquí y con gusto te ayudamos. 💛`

  await sendWhatsAppText(phone, body)
}
