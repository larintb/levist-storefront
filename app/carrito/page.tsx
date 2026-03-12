'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, removeFromCart, updateQuantity, getCartTotal, clearCart } from '@/lib/cart'
import type { CartItem } from '@/types/product'

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCart(getCart())
  }, [])

  const refresh = () => setCart(getCart())

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const total = getCartTotal(cart)

  if (!mounted) return null

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 flex flex-col items-center text-center gap-6">
        <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">Tu bolsa está vacía</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest">Agrega productos del catálogo para continuar.</p>
        <Link
          href="/catalogo"
          className="mt-2 px-8 py-4 bg-[#364458] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors"
        >
          Ir al Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-10">Tu Bolsa</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 flex flex-col gap-0 divide-y divide-gray-100">
          {cart.map((item) => (
            <div key={item.inventory_id} className="flex gap-5 py-6">
              <div className="relative w-24 h-28 bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.product_name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gray-200" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-xs uppercase tracking-tight">{item.product_name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">
                  {item.color} · Talla {item.size}
                </p>
                <p className="font-bold text-sm mt-2">{fmt(item.price)}</p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => { updateQuantity(item.inventory_id, item.quantity - 1); refresh() }}
                    className="w-8 h-8 border border-gray-300 flex items-center justify-center font-bold hover:border-[#364458] transition-colors cursor-pointer text-sm"
                  >−</button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => { updateQuantity(item.inventory_id, item.quantity + 1); refresh() }}
                    disabled={item.quantity >= item.stock}
                    className="w-8 h-8 border border-gray-300 flex items-center justify-center font-bold hover:border-[#364458] transition-colors cursor-pointer text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                  >+</button>
                  {item.quantity >= item.stock && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Máx.</span>
                  )}
                  <button
                    onClick={() => { removeFromCart(item.inventory_id); refresh() }}
                    className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              <div className="hidden sm:block text-right flex-shrink-0">
                <p className="font-black text-sm">{fmt(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <button
              onClick={() => { clearCart(); refresh(); window.dispatchEvent(new Event('cart-updated')) }}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors cursor-pointer"
            >
              Vaciar Bolsa
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="border border-gray-100 p-6 sticky top-24">
            <h2 className="text-xs font-black uppercase tracking-widest mb-6">Resumen del Pedido</h2>

            <div className="flex flex-col gap-2 text-xs mb-6">
              {cart.map((item) => (
                <div key={item.inventory_id} className="flex justify-between text-gray-500 font-bold">
                  <span className="truncate pr-2">{item.product_name} ×{item.quantity}</span>
                  <span className="flex-shrink-0">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between font-black text-sm mb-6">
              <span className="uppercase tracking-widest">Total</span>
              <span>{fmt(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="block w-full py-5 bg-[#364458] text-white text-center text-xs font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors"
            >
              Proceder al Pago
            </Link>

            <Link
              href="/catalogo"
              className="block mt-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors"
            >
              Seguir Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
