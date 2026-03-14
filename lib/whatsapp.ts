const WHAPI_BASE = 'https://gate.whapi.cloud'

function getWhapiToken() {
  const token = process.env.WHAPI_TOKEN
  if (!token) throw new Error('Missing WHAPI_TOKEN')
  return token
}

/** Normaliza un número mexicano a formato internacional sin '+' (ej. 521XXXXXXXXXX) */
function formatMxPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('521') && digits.length === 13) return digits
  if (digits.startsWith('52') && digits.length === 12) return '521' + digits.slice(2)
  if (digits.length === 10) return '521' + digits
  return digits
}

const fmt = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

/** Envía un mensaje de texto plano por WhatsApp. */
export async function sendWhatsAppText(phone: string, body: string): Promise<void> {
  const token = getWhapiToken()
  const to = formatMxPhone(phone)

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
    throw new Error(`Whapi error ${res.status}: ${err}`)
  }
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
  const shortId = order_id.slice(0, 8).toUpperCase()
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
