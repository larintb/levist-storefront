'use client'

import { useState, useRef } from 'react'

type OrderStatus = 'paid' | 'ready' | 'picked_up' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  product_name: string
  color: string
  size: string
  quantity: number
  price_at_sale: number
}

interface OrderResult {
  id: string
  created_at: string
  status: OrderStatus
  total: number
  items: OrderItem[]
  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
}

const STATUS_INFO: Record<string, { label: string; description: string; color: string; step: number }> = {
  paid:      { label: 'Pago confirmado',     description: 'Tu pago fue recibido. Estamos preparando tu pedido.',         color: 'bg-yellow-400 text-yellow-900', step: 1 },
  ready:     { label: '¡Listo para recoger!',description: 'Tu pedido está listo. Puedes pasar a recogerlo a la tienda.', color: 'bg-green-500 text-white',        step: 2 },
  shipped:   { label: 'En camino',           description: 'Tu pedido está en camino a tu domicilio.',                    color: 'bg-blue-500 text-white',         step: 2 },
  picked_up: { label: 'Entregado ✓',         description: 'Pedido entregado. ¡Gracias por tu compra!',                  color: 'bg-black text-white',            step: 3 },
  delivered: { label: 'Entregado ✓',         description: 'Tu pedido fue entregado. ¡Gracias por tu compra!',           color: 'bg-black text-white',            step: 3 },
  cancelled: { label: 'Cancelado',           description: 'Este pedido fue cancelado. Contáctanos si tienes dudas.',     color: 'bg-red-500 text-white',          step: 0 },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

function StatusBar({ status, method }: { status: OrderStatus; method: 'pickup' | 'delivery' }) {
  const step = STATUS_INFO[status]?.step ?? 1
  const isPickup = method === 'pickup'

  const steps = isPickup
    ? ['Pago recibido', 'Listo para recoger', 'Recogido']
    : ['Pago recibido', 'En camino', 'Entregado']

  return (
    <div className="flex items-center gap-0 w-full mb-6">
      {steps.map((label, i) => {
        const done   = step > i
        const active = step === i + 1
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-center">
              {i > 0 && <div className={`flex-1 h-0.5 ${done || active ? 'bg-black' : 'bg-gray-200'}`} />}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2
                ${done   ? 'bg-black text-white border-black' : ''}
                ${active ? 'bg-black text-white border-black' : ''}
                ${!done && !active ? 'bg-white text-gray-300 border-gray-200' : ''}
              `}>
                {done ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-black' : 'bg-gray-200'}`} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest text-center leading-tight
              ${active || done ? 'text-black' : 'text-gray-300'}
            `}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function PedidosPage() {
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [order, setOrder]     = useState<OrderResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const id = query.trim().replace(/^#/, '')
    if (!id) return

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res  = await fetch(`/api/pedido?id=${encodeURIComponent(id)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'No encontramos ese pedido. Verifica el número e intenta de nuevo.')
        return
      }
      setOrder(data)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = order ? (STATUS_INFO[order.status] ?? STATUS_INFO.paid) : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">LEVIST Uniformes</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Mis Pedidos</h1>
        <p className="text-sm text-gray-500 mt-2">
          Ingresa el número de pedido que recibiste en tu correo de confirmación.
        </p>
      </div>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Ej. A1B2C3D4"
            className="w-full border-b-2 border-gray-300 pb-2 text-sm font-black tracking-widest focus:outline-none focus:border-black transition-colors uppercase"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-colors
            ${loading || !query.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
            }`}
        >
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 px-5 py-4 mb-8">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <p className="text-xs text-red-500 mt-1">
            El número aparece en el correo con el formato: <span className="font-mono font-black">XXXXXXXX</span>
          </p>
        </div>
      )}

      {/* Resultado */}
      {order && statusInfo && (
        <div className="border border-gray-200 bg-white">

          {/* Top bar de estado */}
          <div className={`px-6 py-3 flex items-center justify-between ${statusInfo.color}`}>
            <span className="text-[11px] font-black uppercase tracking-widest">{statusInfo.label}</span>
            <span className="text-[11px] font-black font-mono opacity-75">#{order.id}</span>
          </div>

          <div className="px-6 py-6 flex flex-col gap-6">

            {/* Barra de progreso */}
            {order.status !== 'cancelled' && (
              <StatusBar status={order.status} method={order.delivery_method} />
            )}

            {/* Descripción del estado */}
            <div className="bg-gray-50 border-l-4 border-black px-4 py-3">
              <p className="text-sm font-bold text-gray-800">{statusInfo.description}</p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                Pedido realizado el{' '}
                {new Date(order.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>

            {/* Método de entrega */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                {order.delivery_method === 'pickup' ? '📍 Recoger en tienda' : '🚚 Envío a domicilio'}
              </p>
              {order.delivery_method === 'pickup' ? (
                <p className="text-sm text-gray-700 font-medium">
                  Caracol 10, Acuario 2001, Matamoros, Tamaulipas<br/>
                  <span className="text-xs text-gray-400">Entre Calle 23 y Calle 25</span>
                </p>
              ) : (
                <p className="text-sm text-gray-700 font-medium">
                  {order.delivery_address ?? '—'}
                </p>
              )}
            </div>

            {/* Artículos */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                Productos ({order.items.length})
              </p>
              <div className="flex flex-col divide-y divide-gray-100">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{item.product_name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.color} · Talla {item.size} · ×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-black text-gray-900 tabular-nums flex-shrink-0 ml-4">
                      {fmt(item.price_at_sale * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center border-t border-gray-200 pt-4">
              <span className="text-xs font-black uppercase tracking-widest">Total pagado</span>
              <span className="text-lg font-black tabular-nums">{fmt(order.total)}</span>
            </div>

          </div>

          {/* Footer cálido */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-500">
              ¿Tienes alguna duda? Contáctanos por WhatsApp con tu número de pedido{' '}
              <span className="font-black text-black font-mono">#{order.id}</span> y con gusto te ayudamos. 💛
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
