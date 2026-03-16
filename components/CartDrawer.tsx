'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } from '@/lib/cart'
import type { CartItem } from '@/types/product'
import CompleteYourFit from './CompleteYourFit'

interface AddedItem { name: string; color: string; size: string }

export default function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [addedItem, setAddedItem] = useState<AddedItem | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  const refresh = () => setCart(getCart())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('cart-updated', refresh)
    window.addEventListener('storage', refresh)

    function onAdded(e: Event) {
      const detail = (e as CustomEvent<AddedItem>).detail
      setAddedItem(detail)
      setToastVisible(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setToastVisible(true)))
      setTimeout(() => setToastVisible(false), 2500)
      setTimeout(() => setAddedItem(null), 2900)
    }
    window.addEventListener('cart-added', onAdded)
    return () => {
      window.removeEventListener('cart-updated', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('cart-added', onAdded)
    }
  }, [])

  const count = getCartCount(cart)
  const total = getCartTotal(cart)

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  return (
    <>
      {/* Trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen(true)}
          className="relative cursor-pointer"
          aria-label="Carrito"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#364458] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {count > 99 ? '99' : count}
            </span>
          )}
        </button>

        {/* Toast — portal para escapar del containing block del navbar */}
        {mounted && addedItem && createPortal(
          <div
            className="fixed bottom-24 right-6 z-200 w-72 bg-[#364458] text-white rounded-2xl shadow-2xl pointer-events-none overflow-hidden"
            style={{
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              opacity: toastVisible ? 1 : 0,
              transform: toastVisible ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-[#8AA7C4]/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#8AA7C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4]">Agregado al carrito</p>
                <p className="text-sm font-bold leading-tight line-clamp-1 mt-0.5">{addedItem.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{addedItem.color} · Talla {addedItem.size}</p>
              </div>
            </div>
            <div className="h-0.5 bg-white/10">
              <div
                className="h-full bg-[#8AA7C4]"
                style={{
                  transition: toastVisible ? 'width 2.5s linear' : 'none',
                  width: toastVisible ? '0%' : '100%',
                }}
              />
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Botón flotante — portal para escapar del containing block del navbar */}
      {mounted && createPortal(
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir carrito"
          className="fixed bottom-6 right-6 z-150 w-14 h-14 rounded-full bg-[#364458] text-white shadow-[0_8px_30px_rgba(54,68,88,0.5)] flex items-center justify-center hover:bg-[#2F3F55] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#8AA7C4] text-[#364458] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black leading-none">
              {count > 99 ? '99' : count}
            </span>
          )}
        </button>,
        document.body
      )}

      {/* Backdrop + Drawer — portal centrado en el viewport */}
      {mounted && createPortal(
        <div
          className={`fixed inset-0 z-200 flex items-center justify-center p-4 transition-[visibility] duration-300 ${
            open ? 'visible' : 'invisible'
          }`}
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            open ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Panel */}
          <div
            className={`relative z-10 w-full sm:w-95 max-h-[85vh] rounded-2xl overflow-hidden flex flex-col bg-[#364458] shadow-[0_24px_80px_rgba(0,0,0,0.5)] transition-[transform,opacity] duration-300 ease-in-out ${
              open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Tu Bolsa</h2>
                {count > 0 && (
                  <span className="bg-[#8AA7C4] text-[#364458] text-[10px] font-black px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="cursor-pointer w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-white/10 shrink-0" />

            {/* Items + recomendaciones */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-6 py-4 flex flex-col gap-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30">Tu bolsa está vacía</p>
                    <Link
                      href="/catalogo"
                      onClick={() => setOpen(false)}
                      className="text-xs font-black uppercase tracking-widest text-[#8AA7C4] hover:text-white transition-colors"
                    >
                      Ver Catálogo →
                    </Link>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.inventory_id} className="flex gap-3 bg-white/5 rounded-xl p-3">
                      <div className="relative w-14 shrink-0 rounded-lg bg-white/10 overflow-hidden" style={{ height: '72px' }}>
                        {item.item_type === 'embroidery' ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="6" cy="6" r="3" strokeWidth={1.5} />
                              <circle cx="6" cy="18" r="3" strokeWidth={1.5} />
                              <path strokeLinecap="round" strokeWidth={1.5} d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
                            </svg>
                          </div>
                        ) : item.image_url ? (
                          <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="absolute inset-0 bg-white/10 rounded-lg" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.item_type === 'embroidery' ? (
                          <p className="text-xs font-black uppercase tracking-tight line-clamp-2 text-white leading-tight">
                            Bordado
                          </p>
                        ) : (
                          <Link
                            href={`/catalogo/${item.product_id}?color=${encodeURIComponent(item.color)}`}
                            onClick={() => setOpen(false)}
                            className="text-xs font-black uppercase tracking-tight line-clamp-2 text-white leading-tight hover:text-[#8AA7C4] transition-colors"
                          >{item.product_name}</Link>
                        )}
                        <p className="text-[10px] text-[#8AA7C4] mt-1">
                          {item.item_type === 'embroidery'
                            ? `${item.size} · ${item.embroidery?.tipo === 'logo' ? 'Logo' : item.embroidery?.nombre}`
                            : `${item.color} · Talla ${item.size}`
                          }
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-black text-white">{fmt(item.price)}</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { updateQuantity(item.inventory_id, item.quantity - 1); refresh(); window.dispatchEvent(new Event('cart-updated')) }}
                              className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs hover:bg-white/20 cursor-pointer transition-colors"
                            >−</button>
                            <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => { updateQuantity(item.inventory_id, item.quantity + 1); refresh(); window.dispatchEvent(new Event('cart-updated')) }}
                              className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-xs hover:bg-white/20 cursor-pointer transition-colors"
                            >+</button>
                            <button
                              onClick={() => { removeFromCart(item.inventory_id); refresh(); window.dispatchEvent(new Event('cart-updated')) }}
                              className="ml-1 text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-red-300 cursor-pointer transition-colors"
                            >✕</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && <CompleteYourFit cartItems={cart} onCartUpdate={refresh} />}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 pb-6 pt-4 flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8AA7C4]">Subtotal</span>
                  <span className="text-base font-black text-white">{fmt(total)}</span>
                </div>
                <Link
                  href="/carrito"
                  onClick={() => setOpen(false)}
                  className="w-full py-3.5 bg-white text-[#364458] text-center text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#8AA7C4] transition-colors"
                >
                  Ver Bolsa →
                </Link>
                <Link
                  href="/catalogo"
                  onClick={() => setOpen(false)}
                  className="text-center text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors"
                >
                  Seguir Comprando
                </Link>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
