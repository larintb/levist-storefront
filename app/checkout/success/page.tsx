'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { clearCart } from '@/lib/cart'

interface OrderItem {
  inventory_id: string
  product_name: string
  color: string
  size: string
  image_url: string | null
  quantity: number
  price: number
  subtotal: number
}

interface OrderData {
  customer_name: string | null
  customer_email: string | null
  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
  items: OrderItem[]
  items_total: number
  discount_amount: number
  total: number
  order_id: string | null
}

type Status = 'loading' | 'paid' | 'unpaid' | 'error'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId    = searchParams.get('session_id')
  const [status, setStatus]   = useState<Status>('loading')
  const [order,  setOrder]    = useState<OrderData | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!sessionId) { setStatus('error'); return }

    fetch(`/api/checkout/verify?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        const paid = data.status === 'complete' &&
          (data.payment_status === 'paid' || data.payment_status === 'no_payment_required')

        if (paid) {
          setOrder(data)
          setStatus('paid')
          clearCart()
          window.dispatchEvent(new Event('cart-updated'))
        } else {
          setStatus('unpaid')
        }
      })
      .catch(() => setStatus('error'))
  }, [sessionId])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#364458] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verificando pago...</p>
      </div>
    )
  }

  // ── Pago fallido ─────────────────────────────────────────────────────────
  if (status !== 'paid' || !order) {
    return (
      <div className="max-w-lg mx-auto px-6 py-28 flex flex-col items-center text-center gap-8">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Pago no completado</h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            No se realizó ningún cargo. Puedes intentarlo de nuevo.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/checkout" className="flex-1 py-4 bg-[#364458] text-white text-center text-xs font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors">
            Intentar de Nuevo
          </Link>
          <Link href="/catalogo" className="flex-1 py-4 border border-gray-300 text-center text-xs font-black uppercase tracking-widest hover:border-[#364458] transition-colors">
            Ver Catálogo
          </Link>
        </div>
      </div>
    )
  }

  // ── Pago exitoso ─────────────────────────────────────────────────────────
  const shortId = order.order_id ? order.order_id.slice(0, 8).toUpperCase() : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-5 mb-12">
        <div className="w-16 h-16 bg-[#364458] flex items-center justify-center rounded-full">
          <svg className="w-8 h-8 text-[#8AA7C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">¡Pedido Confirmado!</h1>
          {order.customer_name && (
            <p className="text-sm text-gray-500 mt-2">Gracias, <strong className="text-[#364458]">{order.customer_name}</strong></p>
          )}
          {order.customer_email && (
            <p className="text-xs text-gray-400 mt-1">Confirmación enviada a <strong>{order.customer_email}</strong></p>
          )}
        </div>
      </div>

      {/* Número de orden */}
      {shortId && (
        <div className="bg-[#364458] text-white px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4]">Número de Pedido</p>
            <p className="font-mono font-black text-xl mt-0.5">#{shortId}</p>
          </div>
          <svg className="w-8 h-8 text-[#8AA7C4] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      )}

      {/* Entrega */}
      <div className="border border-gray-100 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
        <div className="w-8 h-8 bg-[#EEF2F6] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          {order.delivery_method === 'delivery'
            ? <svg className="w-4 h-4 text-[#364458]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 18H3V8l5-4h8l4 4v6h-4"/><circle cx="8" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13h6l-2-4h-4v4z"/></svg>
            : <svg className="w-4 h-4 text-[#364458]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9"/></svg>
          }
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {order.delivery_method === 'delivery' ? 'Envío a domicilio' : 'Recoger en tienda'}
          </p>
          <p className="text-sm font-bold text-[#364458] mt-0.5">
            {order.delivery_method === 'delivery'
              ? (order.delivery_address ?? '—')
              : 'Caracol 10, Acuario 2001, Matamoros, Tam.'}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tu Pedido</p>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map(item => (
            <div key={item.inventory_id} className="px-5 py-4 flex items-center gap-4">
              <div className="relative w-14 h-16 bg-gray-100 flex-shrink-0 overflow-hidden rounded-lg">
                {item.image_url
                  ? <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="56px" />
                  : <div className="absolute inset-0 bg-gray-200" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-tight line-clamp-2 text-[#364458]">{item.product_name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                  {item.color} · T. {item.size} · ×{item.quantity}
                </p>
              </div>
              <p className="text-sm font-black flex-shrink-0 text-[#364458]">{fmt(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="border-t border-gray-100 px-5 py-4 flex flex-col gap-2 bg-gray-50">
          <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-widest">
            <span>Subtotal</span>
            <span>{fmt(order.items_total)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-green-600">
              <span>Descuento</span>
              <span>-{fmt(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-sm uppercase tracking-widest border-t border-gray-200 pt-2 mt-1 text-[#364458]">
            <span>Total</span>
            <span>{fmt(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/catalogo" className="flex-1 py-4 bg-[#364458] text-white text-center text-xs font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors rounded-xl">
          Seguir Comprando
        </Link>
        <Link href="/" className="flex-1 py-4 border border-gray-200 text-center text-xs font-black uppercase tracking-widest hover:border-[#364458] transition-colors rounded-xl">
          Ir al Inicio
        </Link>
      </div>

    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-6 py-32 flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#364458] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
