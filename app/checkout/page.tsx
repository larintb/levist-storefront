'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getCart, getCartTotal } from '@/lib/cart'
import type { CartItem } from '@/types/product'
import AddressAutocomplete from '@/components/AddressAutocomplete'

type DeliveryMethod = 'pickup' | 'delivery'

const STORE_LAT = 25.860658261552587 //25.860658261552587, -97.52131975816589
const STORE_LON = -97.52131975816589
const STORE_LABEL = encodeURIComponent('Levist Uniforms – Matamoros, Tam.')

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '' })
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')

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
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setError('Por favor ingresa tu dirección de entrega.')
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
          delivery_method: deliveryMethod,
          delivery_address: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
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

      {/* Método de entrega */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
          ¿Cómo quieres recibir tu pedido?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Recoger en tienda */}
          <button
            type="button"
            onClick={() => setDeliveryMethod('pickup')}
            className={`group flex flex-col items-center gap-3 py-6 px-4 border-2 transition-all cursor-pointer ${
              deliveryMethod === 'pickup'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            {/* Store icon */}
            <svg
              className={`w-7 h-7 ${deliveryMethod === 'pickup' ? 'text-white' : 'text-gray-500 group-hover:text-black'} transition-colors`}
              fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
            </svg>
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-widest">Recoger en tienda</p>
              <p className={`text-[10px] mt-0.5 font-medium ${deliveryMethod === 'pickup' ? 'text-gray-300' : 'text-gray-400'}`}>
                Gratis · Matamoros
              </p>
            </div>
          </button>

          {/* Envío a domicilio */}
          <button
            type="button"
            onClick={() => setDeliveryMethod('delivery')}
            className={`group flex flex-col items-center gap-3 py-6 px-4 border-2 transition-all cursor-pointer ${
              deliveryMethod === 'delivery'
                ? 'border-black bg-black text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            {/* Delivery truck icon */}
            <svg
              className={`w-7 h-7 ${deliveryMethod === 'delivery' ? 'text-white' : 'text-gray-500 group-hover:text-black'} transition-colors`}
              fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 18H3V8l5-4h8l4 4v6h-4" />
              <circle cx="8" cy="19" r="1.5" />
              <circle cx="17" cy="19" r="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13h6l-2-4h-4v4z" />
            </svg>
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-widest">Envío a domicilio</p>
              <p className={`text-[10px] mt-0.5 font-medium ${deliveryMethod === 'delivery' ? 'text-gray-300' : 'text-gray-400'}`}>
                Dentro de Matamoros
              </p>
            </div>
          </button>
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

            {/* Address field — delivery only */}
            {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Dirección de entrega *{' '}
                  <span className="normal-case font-normal">(Matamoros, Tamaulipas)</span>
                </label>
                <AddressAutocomplete value={deliveryAddress} onChange={setDeliveryAddress} />
              </div>
            )}

            {/* Store map — pickup only */}
            {deliveryMethod === 'pickup' && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                  Ubicación de nuestra tienda
                </p>
                <div className="overflow-hidden border border-gray-200">
                  <iframe
                    title="Levist Store"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${STORE_LON - 0.007},${STORE_LAT - 0.005},${STORE_LON + 0.007},${STORE_LAT + 0.005}&layer=mapnik&marker=${STORE_LAT},${STORE_LON}`}
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${STORE_LAT},${STORE_LON}&z=16&label=${STORE_LABEL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Abrir en Google Maps
                </a>
              </div>
            )}

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
