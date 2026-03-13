import { getResend, FROM_EMAIL } from './resend'

interface OrderItem {
  product_name: string
  color: string
  size: string
  quantity: number
  price_at_sale: number
}

interface SendOrderConfirmationParams {
  to: string
  customer_name: string
  order_id: string
  items: OrderItem[]
  total: number
  delivery_method: 'pickup' | 'delivery'
  delivery_address?: string
}

interface SendOrderReadyParams {
  to: string
  customer_name: string
  order_id: string
  delivery_method?: 'pickup' | 'delivery'
  custom_message?: string
}

const fmt = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

const STORE_LAT  = 25.860658
const STORE_LON  = -97.521319
const STORE_ADDR = 'Caracol 10, Acuario 2001, Matamoros, Tamaulipas'
const STORE_REF  = 'Entre Calle 23 y Calle 25'
const MAPS_URL   = `https://www.google.com/maps?q=${STORE_LAT},${STORE_LON}&z=17`

function staticMapUrl(apiKey: string) {
  const params = new URLSearchParams({
    center:  `${STORE_LAT},${STORE_LON}`,
    zoom:    '16',
    size:    '560x200',
    scale:   '2',
    maptype: 'roadmap',
    markers: `color:0x364458|label:L|${STORE_LAT},${STORE_LON}`,
    key:     apiKey,
  })
  return `https://maps.googleapis.com/maps/api/staticmap?${params}`
}

// ─── Shared pieces ────────────────────────────────────────────────────────────

function emailHeader() {
  return `
    <div style="background:#364458; padding:32px 40px; display:flex; align-items:center; justify-content:space-between;">
      <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:900; font-style:italic; letter-spacing:-1px;">LEVIST</h1>
      <span style="color:#8AA7C4; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px;">Uniformes</span>
    </div>`
}

function emailFooter() {
  return `
    <div style="background:#2F3F55; padding:28px 40px;">
      <p style="color:#4b5563; font-size:11px; margin:0 0 12px; text-transform:uppercase; letter-spacing:1px;">
        LEVIST Uniformes · Matamoros, Tamaulipas
      </p>

      <!-- Redes sociales -->
      <div style="margin-bottom:16px;">
        <!-- Instagram -->
        <a href="https://www.instagram.com/levistuniforms/" target="_blank"
           style="display:inline-block; background:#ffffff14; border-radius:50%; width:36px; height:36px; text-align:center; line-height:36px; text-decoration:none; margin-right:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8AA7C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-top:-2px;">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="#8AA7C4" stroke="none"/>
          </svg>
        </a>
        <!-- TikTok -->
        <a href="https://www.tiktok.com/@levist.uniformes" target="_blank"
           style="display:inline-block; background:#ffffff14; border-radius:50%; width:36px; height:36px; text-align:center; line-height:36px; text-decoration:none; margin-right:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#8AA7C4" style="vertical-align:middle; margin-top:-2px;">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.67a8.19 8.19 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01z"/>
          </svg>
        </a>
        <!-- Facebook -->
        <a href="https://www.facebook.com/uniformesmedicoslevist" target="_blank"
           style="display:inline-block; background:#ffffff14; border-radius:50%; width:36px; height:36px; text-align:center; line-height:36px; text-decoration:none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#8AA7C4" style="vertical-align:middle; margin-top:-2px;">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        </a>
      </div>

      <p style="color:#374151; font-size:11px; margin:0;">
        Este correo es automático. Si tienes dudas escríbenos directamente por WhatsApp.
      </p>
    </div>`
}

function itemsTable(items: OrderItem[], total: number) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:14px 0; border-bottom:1px solid #f3f4f6; vertical-align:top;">
        <span style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.3px; color:#364458;">${item.product_name}</span><br/>
        <span style="font-size:12px; color:#9ca3af; margin-top:2px; display:inline-block;">${item.color} &nbsp;·&nbsp; Talla ${item.size}</span>
      </td>
      <td style="padding:14px 0; border-bottom:1px solid #f3f4f6; text-align:center; font-size:13px; color:#374151; vertical-align:top;">
        ×${item.quantity}
      </td>
      <td style="padding:14px 0; border-bottom:1px solid #f3f4f6; text-align:right; font-size:13px; font-weight:700; color:#364458; vertical-align:top;">
        ${fmt(item.price_at_sale * item.quantity)}
      </td>
    </tr>`).join('')

  return `
    <table style="width:100%; border-collapse:collapse; margin-bottom:4px;">
      <thead>
        <tr>
          <th style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af; padding-bottom:10px; text-align:left; border-bottom:2px solid #364458;">Producto</th>
          <th style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af; padding-bottom:10px; text-align:center; border-bottom:2px solid #364458;">Cant.</th>
          <th style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af; padding-bottom:10px; text-align:right; border-bottom:2px solid #364458;">Precio</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:18px 0 0; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:1px; color:#364458;">Total pagado</td>
          <td style="padding:18px 0 0; text-align:right; font-size:20px; font-weight:900; color:#364458;">${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>`
}

// ─── Email 1 — Confirmación de pedido ─────────────────────────────────────────

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const { to, customer_name, order_id, items, total, delivery_method, delivery_address } = params
  const resend  = getResend()
  const shortId = order_id.slice(0, 8).toUpperCase()
  const apiKey  = process.env.GOOGLE_PLACES_API_KEY ?? ''

  // ── Sección de entrega según método ──────────────────────────────────────
  const deliverySection = delivery_method === 'pickup' ? `
    <!-- Recogida en tienda -->
    <div style="margin-top:36px;">
      <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px; color:#9ca3af; margin:0 0 16px;">
        📍 Dónde recoger tu pedido
      </p>

      <!-- Mapa -->
      <a href="${MAPS_URL}" target="_blank" style="display:block; margin-bottom:16px; border:1px solid #e5e7eb;">
        <img
          src="${staticMapUrl(apiKey)}"
          alt="Mapa de la tienda"
          width="560"
          style="width:100%; max-width:560px; display:block;"
        />
      </a>

      <!-- Dirección -->
      <div style="background:#f9fafb; border-left:4px solid #8AA7C4; padding:20px 24px; margin-bottom:16px;">
        <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#364458;">${STORE_ADDR}</p>
        <p style="margin:0 0 12px; font-size:12px; color:#6b7280;">${STORE_REF}</p>
        <p style="margin:0; font-size:12px; color:#374151; line-height:1.6;">
          Cuando tu pedido esté listo recibirás un segundo correo avisándote. Solo preséntate con este correo o el número de pedido.
        </p>
      </div>

      <!-- Botón mapa -->
      <a href="${MAPS_URL}" target="_blank"
         style="display:inline-block; background:#364458; color:#fff; padding:12px 24px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; text-decoration:none;">
        Ver en Google Maps →
      </a>
    </div>
  ` : `
    <!-- Envío a domicilio -->
    <div style="margin-top:36px;">
      <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px; color:#9ca3af; margin:0 0 16px;">
        🚚 Dirección de entrega
      </p>
      <div style="background:#f9fafb; border-left:4px solid #364458; padding:20px 24px;">
        <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#364458; line-height:1.5;">
          ${delivery_address ?? '—'}
        </p>
        <p style="margin:0; font-size:12px; color:#6b7280; line-height:1.6;">
          En cuanto tu pedido esté listo y en camino recibirás un segundo correo de confirmación.
        </p>
      </div>
    </div>
  `

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.1);">

        ${emailHeader()}

        <div style="padding:40px;">

          <!-- Badge -->
          <div style="display:inline-block; background:#8AA7C4; padding:5px 12px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:28px;">
            ✓ &nbsp;Pago Confirmado
          </div>

          <!-- Saludo -->
          <h2 style="font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px; color:#364458;">
            ¡Hola, ${customer_name}!
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 8px; line-height:1.6;">
            Recibimos tu pedido y el pago fue procesado exitosamente. 🎉
          </p>
          <p style="color:#6b7280; font-size:14px; margin:0 0 36px; line-height:1.6;">
            Número de pedido: <strong style="color:#364458; font-family:monospace; font-size:15px;">#${shortId}</strong>
          </p>

          <!-- Resumen -->
          <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px; color:#9ca3af; margin:0 0 16px;">
            🧾 Resumen del pedido
          </p>
          ${itemsTable(items, total)}

          <!-- Entrega -->
          ${deliverySection}

          <!-- Mensaje de confianza -->
          <div style="margin-top:36px; background:#EEF2F6; border:1px solid #C5D5E5; padding:18px 22px;">
            <p style="margin:0; font-size:13px; color:#364458; line-height:1.7;">
              <strong>Estamos en esto juntos.</strong> Cualquier pregunta sobre tu pedido no dudes en contactarnos.
              Nuestro equipo está siempre listo para ayudarte. 💛
            </p>
          </div>

        </div>

        ${emailFooter()}
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✓ Pedido confirmado #${shortId} – LEVIST Uniformes`,
    html,
  })
}

// ─── Email 3 — Pedido entregado ───────────────────────────────────────────────

interface SendOrderDeliveredParams {
  to: string
  customer_name: string
  order_id: string
  delivery_method: 'pickup' | 'delivery'
}

export async function sendOrderDelivered(params: SendOrderDeliveredParams) {
  const { to, customer_name, order_id, delivery_method } = params
  const resend  = getResend()
  const shortId = order_id.slice(0, 8).toUpperCase()
  const isDelivery = delivery_method === 'delivery'

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.1);">

        ${emailHeader()}

        <div style="padding:40px;">

          <!-- Badge -->
          <div style="display:inline-block; background:#16a34a; color:#ffffff; padding:5px 12px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:28px;">
            ✓ &nbsp;Pedido Completado
          </div>

          <h2 style="font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px; color:#364458;">
            ¡Gracias, ${customer_name}!
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 8px; line-height:1.6;">
            Tu pedido <strong style="color:#364458; font-family:monospace;">#${shortId}</strong>
            ${isDelivery ? 'ha sido entregado.' : 'fue recogido exitosamente.'}
          </p>
          <p style="color:#6b7280; font-size:14px; margin:0 0 36px; line-height:1.6;">
            Esperamos que disfrutes tu compra. 🎉
          </p>

          <!-- Mensaje cálido -->
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:24px; margin-bottom:28px;">
            <p style="margin:0; font-size:14px; color:#15803d; line-height:1.8; font-weight:700;">
              Tu pedido está completo. ¡Gracias por confiar en LEVIST!
            </p>
            <p style="margin:8px 0 0; font-size:13px; color:#166534; line-height:1.7;">
              Si tienes alguna duda o necesitas algo más, no dudes en contactarnos. Siempre estamos aquí para ayudarte. 💛
            </p>
          </div>

          <!-- Número de pedido -->
          <div style="background:#f9fafb; border-left:4px solid #8AA7C4; padding:16px 24px;">
            <p style="margin:0 0 4px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af;">Número de pedido</p>
            <p style="margin:0; font-family:monospace; font-size:20px; font-weight:900; color:#364458;">#${shortId}</p>
          </div>

        </div>

        ${emailFooter()}
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✓ Pedido completado #${shortId} – LEVIST Uniformes`,
    html,
  })
}

// ─── Email 2 — Pedido listo ───────────────────────────────────────────────────

export async function sendOrderReady(params: SendOrderReadyParams) {
  const { to, customer_name, order_id, delivery_method = 'pickup', custom_message } = params
  const resend  = getResend()
  const shortId = order_id.slice(0, 8).toUpperCase()
  const apiKey  = process.env.GOOGLE_PLACES_API_KEY ?? ''
  const isDelivery = delivery_method === 'delivery'

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.1);">

        ${emailHeader()}

        <div style="padding:40px;">

          <!-- Badge -->
          <div style="display:inline-block; background:#364458; color:#8AA7C4; padding:5px 12px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:28px;">
            🎉 &nbsp;¡Tu pedido está listo!
          </div>

          <h2 style="font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px; color:#364458;">
            ${isDelivery ? `¡${customer_name}, tu pedido está en camino!` : `¡${customer_name}, ya puedes pasar!`}
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 8px; line-height:1.6;">
            Tu pedido <strong style="color:#364458; font-family:monospace;">#${shortId}</strong>
            ${isDelivery ? 'ha salido y está en camino a tu domicilio.' : 'está listo y esperándote en nuestra tienda.'}
          </p>
          <p style="color:#6b7280; font-size:14px; margin:0 0 36px; line-height:1.6;">
            ${isDelivery ? 'Pronto lo recibirás en tu puerta.' : 'Solo preséntate con este correo o el número de pedido al llegar.'}
          </p>

          ${custom_message ? `
          <!-- Mensaje personalizado del equipo -->
          <div style="margin-bottom:28px; background:#EEF2F6; border-left:4px solid #8AA7C4; padding:18px 24px;">
            <p style="margin:0 0 6px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#364458;">
              💬 Mensaje de nuestro equipo
            </p>
            <p style="margin:0; font-size:14px; color:#364458; line-height:1.7;">${custom_message}</p>
          </div>
          ` : ''}

          ${!isDelivery ? `
          <!-- Mapa tienda -->
          <p style="font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:3px; color:#9ca3af; margin:0 0 16px;">
            📍 Dónde recogemos
          </p>
          <a href="${MAPS_URL}" target="_blank" style="display:block; margin-bottom:16px; border:1px solid #e5e7eb;">
            <img src="${staticMapUrl(apiKey)}" alt="Mapa de la tienda" width="560" style="width:100%; max-width:560px; display:block;" />
          </a>
          <div style="background:#f9fafb; border-left:4px solid #8AA7C4; padding:20px 24px; margin-bottom:20px;">
            <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#364458;">${STORE_ADDR}</p>
            <p style="margin:0 0 16px; font-size:12px; color:#6b7280;">${STORE_REF}</p>
            <p style="margin:0; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:1px; color:#364458;">
              Número de pedido: <span style="font-family:monospace; font-size:16px;">#${shortId}</span>
            </p>
          </div>
          <a href="${MAPS_URL}" target="_blank"
             style="display:inline-block; background:#364458; color:#fff; padding:12px 24px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; text-decoration:none;">
            Ver en Google Maps →
          </a>
          ` : `
          <!-- Número de pedido para envíos -->
          <div style="background:#f9fafb; border-left:4px solid #364458; padding:20px 24px; margin-bottom:20px;">
            <p style="margin:0 0 8px; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:1px; color:#364458;">
              Número de pedido
            </p>
            <p style="margin:0; font-family:monospace; font-size:22px; font-weight:900; color:#364458;">#${shortId}</p>
          </div>
          `}

          <!-- Mensaje cálido -->
          <div style="margin-top:36px; background:#EEF2F6; border:1px solid #C5D5E5; padding:18px 22px;">
            <p style="margin:0; font-size:13px; color:#364458; line-height:1.7;">
              ${isDelivery ? '¡Gracias por tu compra! Cualquier duda estamos aquí para ayudarte. 💛' : '¡Gracias por confiar en nosotros! Esperamos verte pronto. 💛'}
            </p>
          </div>

        </div>

        ${emailFooter()}
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: isDelivery
      ? `📦 Tu pedido está en camino – LEVIST #${shortId}`
      : `🎉 Tu pedido está listo para recoger – LEVIST #${shortId}`,
    html,
  })
}

// ─── Email — Pedido cancelado ─────────────────────────────────────────────────

interface SendOrderCancelledParams {
  to: string
  customer_name: string
  order_id: string
}

export async function sendOrderCancelled(params: SendOrderCancelledParams) {
  const { to, customer_name, order_id } = params
  const resend  = getResend()
  const shortId = order_id.slice(0, 8).toUpperCase()

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.1);">

        ${emailHeader()}

        <div style="padding:40px;">

          <!-- Badge -->
          <div style="display:inline-block; background:#fee2e2; color:#b91c1c; padding:5px 12px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:28px;">
            ✕ &nbsp;Pedido Cancelado
          </div>

          <h2 style="font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px; color:#364458;">
            Hola, ${customer_name}
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 8px; line-height:1.6;">
            Tu pedido <strong style="color:#364458; font-family:monospace; font-size:15px;">#${shortId}</strong> ha sido cancelado.
          </p>
          <p style="color:#6b7280; font-size:14px; margin:0 0 36px; line-height:1.6;">
            Si realizaste el pago con tarjeta, el reembolso se procesará en los próximos días hábiles según tu banco.
          </p>

          <!-- Número de pedido -->
          <div style="background:#fef2f2; border-left:4px solid #fca5a5; padding:20px 24px; margin-bottom:28px;">
            <p style="margin:0 0 4px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af;">Número de pedido cancelado</p>
            <p style="margin:0; font-family:monospace; font-size:20px; font-weight:900; color:#b91c1c;">#${shortId}</p>
          </div>

          <!-- Mensaje -->
          <div style="background:#EEF2F6; border:1px solid #C5D5E5; padding:18px 22px;">
            <p style="margin:0; font-size:13px; color:#364458; line-height:1.7;">
              Si crees que esto fue un error o tienes alguna duda, contáctanos por WhatsApp y con gusto te ayudamos. 💛
            </p>
          </div>

        </div>

        ${emailFooter()}
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Pedido cancelado #${shortId} – LEVIST Uniformes`,
    html,
  })
}

// ─── Email 4 — Back in stock ──────────────────────────────────────────────────

interface SendBackInStockParams {
  to: string
  product_name: string
  color: string
  product_id: string
}

export async function sendBackInStockEmail(params: SendBackInStockParams) {
  const { to, product_name, color, product_id } = params
  const resend   = getResend()
  const href     = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://levist.mx'}/catalogo/${product_id}`

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f3f4f6; font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,.1);">

        ${emailHeader()}
        <div style="height:4px; background:#8AA7C4;"></div>

        <div style="padding:40px;">

          <div style="display:inline-block; background:#364458; color:#8AA7C4; padding:5px 12px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:28px;">
            🔔 &nbsp;¡Ya está disponible!
          </div>

          <h2 style="font-size:24px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px; color:#364458;">
            Tu producto favorito volvió
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 28px; line-height:1.6;">
            El producto que estabas esperando ya tiene stock disponible. ¡No te quedes sin él!
          </p>

          <div style="background:#f9fafb; border-left:4px solid #8AA7C4; padding:20px 24px; margin-bottom:28px;">
            <p style="margin:0 0 4px; font-size:16px; font-weight:900; color:#364458; text-transform:uppercase; letter-spacing:0.3px;">
              ${product_name}
            </p>
            <p style="margin:0; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:1px;">
              Color: ${color}
            </p>
          </div>

          <a href="${href}" target="_blank"
             style="display:inline-block; background:#364458; color:#ffffff; padding:14px 32px; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; text-decoration:none; margin-bottom:32px;">
            Ver producto →
          </a>

          <div style="border-top:1px solid #f3f4f6; margin-top:8px; padding-top:24px;">
            <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6;">
              Recibiste este correo porque pediste ser notificado cuando este producto volviera a estar disponible.
            </p>
          </div>

        </div>

        ${emailFooter()}
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🔔 ¡${product_name} (${color}) ya está disponible! – LEVIST`,
    html,
  })
}
