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
}

interface SendOrderReadyParams {
  to: string
  customer_name: string
  order_id: string
}

const fmt = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

// Email 1: Confirmación de pago — se envía automáticamente desde el webhook de Stripe
export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const { to, customer_name, order_id, items, total } = params
  const resend = getResend()

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <strong style="font-size:13px; text-transform:uppercase;">${item.product_name}</strong><br/>
          <span style="font-size:12px; color:#9ca3af;">${item.color} · Talla ${item.size}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align:center; font-size:13px;">
          ×${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align:right; font-size:13px; font-weight:bold;">
          ${fmt(item.price_at_sale * item.quantity)}
        </td>
      </tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f9fafb; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff;">

        <!-- Header -->
        <div style="background:#000000; padding:32px 40px;">
          <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:900; font-style:italic; letter-spacing:-1px;">LEVIST</h1>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <div style="background:#facc15; display:inline-block; padding:4px 10px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:24px;">
            Pago Confirmado ✓
          </div>

          <h2 style="font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px;">
            ¡Hola, ${customer_name}!
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 32px;">
            Tu pedido ha sido confirmado y está siendo preparado.
          </p>

          <!-- Pedido -->
          <h3 style="font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af; margin:0 0 16px; border-bottom:2px solid #111; padding-bottom:8px;">
            Resumen del Pedido #${order_id.slice(0, 8).toUpperCase()}
          </h3>

          <table style="width:100%; border-collapse:collapse;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 16px 0 0; font-size:13px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">Total</td>
              <td style="padding: 16px 0 0; text-align:right; font-size:16px; font-weight:900;">${fmt(total)}</td>
            </tr>
          </table>

          <!-- Aviso recogida -->
          <div style="margin-top:40px; background:#f9fafb; border-left:4px solid #facc15; padding:20px 24px;">
            <p style="margin:0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">
              📍 Recogida en Tienda
            </p>
            <p style="margin:0; font-size:13px; color:#374151; line-height:1.6;">
              <strong>Por el momento no contamos con servicio de envíos (próximamente).</strong><br/>
              Cuando tu pedido esté listo recibirás un segundo correo. Puedes pasar a recogerlo en nuestra tienda en el horario de atención.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#111; padding:24px 40px;">
          <p style="color:#6b7280; font-size:11px; margin:0; text-transform:uppercase; letter-spacing:1px;">
            © ${new Date().getFullYear()} LEVIST Uniformes — Este es un correo automático, no responder.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `✓ Pedido confirmado – LEVIST Uniformes #${order_id.slice(0, 8).toUpperCase()}`,
    html,
  })
}

// Email 2: Pedido listo para recoger — se envía manualmente desde el panel admin
export async function sendOrderReady(params: SendOrderReadyParams) {
  const { to, customer_name, order_id } = params
  const resend = getResend()

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0; padding:0; background:#f9fafb; font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width:600px; margin:40px auto; background:#ffffff;">

        <!-- Header -->
        <div style="background:#000000; padding:32px 40px;">
          <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:900; font-style:italic; letter-spacing:-1px;">LEVIST</h1>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <div style="background:#facc15; display:inline-block; padding:4px 10px; font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:24px;">
            Tu pedido está listo 🎉
          </div>

          <h2 style="font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; margin:0 0 8px;">
            ¡${customer_name}, tu pedido está listo!
          </h2>
          <p style="color:#6b7280; font-size:14px; margin:0 0 32px;">
            Tu pedido <strong>#${order_id.slice(0, 8).toUpperCase()}</strong> ha sido preparado y está esperándote en nuestra tienda.
          </p>

          <div style="background:#f9fafb; border-left:4px solid #000; padding:20px 24px;">
            <p style="margin:0; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">
              📍 Instrucciones de Recogida
            </p>
            <p style="margin:0; font-size:13px; color:#374151; line-height:1.6;">
              Puedes pasar a recoger tu pedido en nuestra tienda durante el horario de atención.<br/><br/>
              Presenta este correo o el número de pedido al llegar:<br/>
              <strong style="font-size:16px; font-family:monospace;">#${order_id.slice(0, 8).toUpperCase()}</strong>
            </p>
          </div>

          <div style="margin-top:24px; background:#fef9c3; padding:16px 20px;">
            <p style="margin:0; font-size:12px; color:#713f12;">
              <strong>Nota:</strong> Actualmente no contamos con servicio de envíos (próximamente disponible). Los pedidos solo se entregan en tienda.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#111; padding:24px 40px;">
          <p style="color:#6b7280; font-size:11px; margin:0; text-transform:uppercase; letter-spacing:1px;">
            © ${new Date().getFullYear()} LEVIST Uniformes — Este es un correo automático, no responder.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Tu pedido está listo para recoger – LEVIST #${order_id.slice(0, 8).toUpperCase()}`,
    html,
  })
}
