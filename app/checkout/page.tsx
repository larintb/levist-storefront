'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getCart, getCartTotal } from '@/lib/cart'
import type { CartItem } from '@/types/product'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '' })

  useEffect(() => {
    setMounted(true)
    const c = getCart()
    if (c.length === 0) { router.replace('/carrito'); return }
    setCart(c)
  }, [router])

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const total = getCartTotal(cart)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.customer_email.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          customer_name:  form.customer_name,
          customer_phone: form.customer_phone,
          customer_email: form.customer_email,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al iniciar el pago. Intenta de nuevo.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-10">Finalizar Compra</h1>

      {/* Aviso envíos */}
      <div className="bg-yellow-400 px-5 py-4 mb-8 flex gap-3 items-start">
        <span className="text-xl mt-0.5">📍</span>
        <div>
          <p className="text-xs font-black uppercase tracking-widest">Solo recogida en tienda</p>
          <p className="text-xs text-gray-800 mt-1">
            Actualmente no contamos con servicio de envíos <span className="font-bold">(próximamente disponible)</span>.
            Tu pedido quedará listo para recoger en nuestra tienda y te avisaremos por correo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Formulario */}
        <div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h2 className="text-xs font-black uppercase tracking-widest border-b border-gray-100 pb-4">
              Tus Datos
            </h2>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Nombre completo *
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
                className="w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Correo electrónico * <span className="normal-case font-normal">(recibirás confirmación aquí)</span>
              </label>
              <input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                required
                className="w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                required
                className="w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{error}</p>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {loading ? 'Procesando...' : `Pagar ${fmt(total)}`}
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pago seguro con Stripe
              </div>
            </div>
          </form>
        </div>

        {/* Resumen */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest border-b border-gray-100 pb-4 mb-6">
            Tu Pedido
          </h2>
          <div className="flex flex-col gap-5">
            {cart.map((item) => (
              <div key={item.inventory_id} className="flex gap-4 items-center">
                <div className="relative w-16 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight line-clamp-2">{item.product_name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                    {item.color} · T. {item.size} · ×{item.quantity}
                  </p>
                </div>
                <p className="text-xs font-black flex-shrink-0">{fmt(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-6 pt-6">
            <div className="flex justify-between font-black text-sm uppercase tracking-widest">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
