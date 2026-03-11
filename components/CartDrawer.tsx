'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } from '@/lib/cart'
import type { CartItem } from '@/types/product'

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])

  const refresh = () => setCart(getCart())

  useEffect(() => {
    refresh()
    window.addEventListener('cart-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('cart-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const count = getCartCount(cart)
  const total = getCartTotal(cart)

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="relative cursor-pointer"
        aria-label="Carrito"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {count > 99 ? '99' : count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-black uppercase tracking-widest">Tu Bolsa ({count})</h2>
          <button onClick={() => setOpen(false)} className="cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tu bolsa está vacía</p>
              <Link
                href="/catalogo"
                onClick={() => setOpen(false)}
                className="text-xs font-black uppercase tracking-widest underline"
              >
                Ver Catálogo
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.inventory_id} className="flex gap-4">
                <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight line-clamp-2">{item.product_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.color} · T. {item.size}</p>
                  <p className="text-sm font-bold mt-1">{fmt(item.price)}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { updateQuantity(item.inventory_id, item.quantity - 1); refresh() }}
                      className="w-6 h-6 border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-100 cursor-pointer"
                    >−</button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => { updateQuantity(item.inventory_id, item.quantity + 1); refresh() }}
                      className="w-6 h-6 border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-100 cursor-pointer"
                    >+</button>
                    <button
                      onClick={() => { removeFromCart(item.inventory_id); refresh() }}
                      className="ml-auto text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Subtotal</span>
              <span className="text-lg font-black">{fmt(total)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              className="w-full py-4 bg-black text-white text-center text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Ir a Pagar
            </Link>
            <Link
              href="/catalogo"
              onClick={() => setOpen(false)}
              className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black"
            >
              Seguir Comprando
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
