'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { clearCart } from '@/lib/cart'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (!cleared) {
      clearCart()
      window.dispatchEvent(new Event('cart-updated'))
      setCleared(true)
    }
  }, [cleared])

  return (
    <div className="max-w-lg mx-auto px-6 py-28 flex flex-col items-center text-center gap-8">
      {/* Icono */}
      <div className="w-20 h-20 bg-yellow-400 flex items-center justify-center">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">¡Pedido Confirmado!</h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-3">
          Tu pago fue procesado exitosamente.
        </p>
      </div>

      {orderId && (
        <div className="border border-gray-200 px-6 py-4 w-full text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Número de Pedido</p>
          <p className="font-mono font-black text-sm mt-1 break-all">{orderId}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/catalogo"
          className="flex-1 py-4 bg-black text-white text-center text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Seguir Comprando
        </Link>
        <Link
          href="/"
          className="flex-1 py-4 border border-gray-300 text-center text-xs font-black uppercase tracking-widest hover:border-black transition-colors"
        >
          Ir al Inicio
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-32 text-xs font-black uppercase tracking-widest text-gray-400">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
