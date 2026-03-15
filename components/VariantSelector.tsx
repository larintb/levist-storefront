'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, ProductVariant, ProductSize } from '@/types/product'
import { addToCart, getCart } from '@/lib/cart'
import { colorToHex } from '@/lib/colorToHex'

interface Props {
  product: Product
  initialVariantKey?: string
  onVariantChange?: (variantKey: string) => void
}

export default function VariantSelector({ product, initialVariantKey, onVariantChange }: Props) {
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => {
    if (initialVariantKey) {
      const match = product.variants.find(v => v.variant_key === initialVariantKey)
      if (match && match.color !== 'ADO') return match
    }
    return product.variants.find(v => v.color !== 'ADO' && v.in_stock)
      ?? product.variants.find(v => v.color !== 'ADO')
      ?? product.variants[0]
  })
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showAllColors, setShowAllColors] = useState(false)

  // Notify-me state
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifySent, setNotifySent] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  // Cuántas unidades de este inventory_id ya están en el carrito
  const cartQty = selectedSize
    ? (getCart().find((i) => i.inventory_id === selectedSize.inventory_id)?.quantity ?? 0)
    : 0

  // Cuántas se pueden agregar todavía
  const available = selectedSize ? Math.max(0, selectedSize.stock - cartQty) : 0

  // Is the selected size completely out of stock?
  const sizeOutOfStock = selectedSize !== null && selectedSize.stock <= 0

  useEffect(() => {
    setSelectedSize(null)
    setQuantity(1)
    setNotifySent(false)
    setNotifyEmail('')
    setNotifyError('')
  }, [selectedVariant])

  // Al cambiar de talla, resetear cantidad y notificación
  useEffect(() => {
    if (selectedSize) {
      setQuantity(1)
      setNotifySent(false)
      setNotifyError('')
    }
  }, [selectedSize])

  async function handleNotify() {
    if (!notifyEmail) return
    setNotifyLoading(true)
    setNotifyError('')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          product_id: product.product_id,
          product_name: product.product_name,
          color: selectedVariant.color,
          ...(selectedSize ? { size: selectedSize.size } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setNotifyError(data.error ?? 'Error al registrar')
      } else {
        setNotifySent(true)
      }
    } catch {
      setNotifyError('Error de conexión')
    } finally {
      setNotifyLoading(false)
    }
  }

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  function handleAddToCart() {
    if (!selectedSize || available <= 0) return

    // Doble validación: no pasar del stock real
    const safeQty = Math.min(quantity, available)
    if (safeQty <= 0) return

    addToCart({
      product_id:   product.product_id,
      product_name: product.product_name,
      variant_key:  selectedVariant.variant_key,
      inventory_id: selectedSize.inventory_id,
      color:        selectedVariant.color,
      size:         selectedSize.size,
      price:        selectedSize.price,
      quantity:     safeQty,
      stock:        selectedSize.stock,
      image_url:    selectedVariant.image_url,
    })

    setAdded(true)
    setQuantity(1)
    window.dispatchEvent(new Event('cart-updated'))
    window.dispatchEvent(new CustomEvent('cart-added', { detail: { name: product.product_name, color: selectedVariant.color, size: selectedSize.size } }))
    setTimeout(() => setAdded(false), 2000)
  }

  const atStockLimit = selectedSize !== null && !sizeOutOfStock && available <= 0

  return (
    <div className="flex flex-col gap-6">

      {/* Color */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-3">
          Color:{' '}
          <span className="font-normal text-gray-500">{selectedVariant.color}</span>
          {!selectedVariant.in_stock && (
            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-red-400">Agotado</span>
          )}
        </p>
        {(() => {
          const inStock = product.variants.filter(v => v.color !== 'ADO' && v.in_stock)
          const oos     = product.variants.filter(v => v.color !== 'ADO' && !v.in_stock)
          const visible = showAllColors ? product.variants : inStock
          return (<>
        <div className="flex flex-wrap gap-2">
          {visible.map((variant) => {
            const isOos = !variant.in_stock
            const isSelected = variant.variant_key === selectedVariant.variant_key
            const isAdo = variant.color === 'ADO'
            return (
              <button
                key={variant.variant_key}
                disabled={isAdo}
                onClick={() => { if (!isAdo) { setSelectedVariant(variant); onVariantChange?.(variant.variant_key) } }}
                title={isAdo ? 'No disponible' : isOos ? `${variant.color} — Agotado` : variant.color}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide border transition-all ${
                  isAdo
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : isSelected
                    ? isOos
                      ? 'border-gray-400 bg-gray-100 text-gray-500 cursor-pointer'
                      : 'border-[#364458] bg-[#364458] text-white cursor-pointer'
                    : isOos
                    ? 'border-gray-200 text-gray-400 hover:border-gray-400 cursor-pointer'
                    : 'border-gray-300 text-gray-700 hover:border-[#364458] cursor-pointer'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-[#364458]/10"
                  style={{ backgroundColor: colorToHex(variant.color), opacity: isAdo ? 0.2 : isOos ? 0.5 : 1 }}
                />
                <span className={isAdo || isOos ? 'line-through' : ''}>{variant.color}</span>
              </button>
            )
          })}
        </div>
        {!showAllColors && oos.length > 0 && (
          <button
            onClick={() => setShowAllColors(true)}
            className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-4 h-4 rounded-full border border-dashed border-current flex items-center justify-center text-[8px]">+</span>
            Ver todos los colores · {oos.length} agotado{oos.length > 1 ? 's' : ''}
          </button>
        )}
        </>)
        })()}
      </div>

      {/* Si el color seleccionado está agotado — formulario de notificación */}
      {!selectedVariant.in_stock ? (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
              Color agotado
            </p>
          </div>
          {notifySent ? (
            <div className="bg-[#EEF2F6] border border-[#8AA7C4] px-4 py-4">
              <p className="text-xs font-black uppercase tracking-widest text-[#364458]">
                ✓ Te avisamos cuando esté disponible en {selectedVariant.color}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Avísame cuando haya {selectedVariant.color}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
                  className="flex-1 border border-gray-300 px-3 py-3 text-xs focus:outline-none focus:border-[#364458] transition-colors"
                />
                <button
                  onClick={handleNotify}
                  disabled={notifyLoading || !notifyEmail}
                  className="px-4 py-3 text-xs font-black uppercase tracking-widest bg-[#364458] text-white hover:bg-[#2F3F55] disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {notifyLoading ? '...' : 'Notificar'}
                </button>
              </div>
              {notifyError && (
                <p className="text-[10px] text-red-500 font-bold">{notifyError}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Talla — solo si el color tiene stock */
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-3">
            Talla:{' '}
            {selectedSize
              ? <span className="font-normal text-gray-500">{selectedSize.size}</span>
              : <span className="font-normal text-gray-400">Selecciona</span>
            }
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedVariant.sizes.map((size) => {
              const outOfStock = size.stock <= 0
              const isSelected = selectedSize?.inventory_id === size.inventory_id
              return (
                <button
                  key={size.inventory_id}
                  onClick={() => setSelectedSize(size)}
                  className={`relative min-w-[48px] px-3 py-2 text-xs font-bold border transition-all cursor-pointer overflow-hidden ${
                    isSelected
                      ? outOfStock
                        ? 'border-gray-400 bg-gray-100 text-gray-400'
                        : 'border-[#364458] bg-[#364458] text-white'
                      : outOfStock
                      ? 'border-gray-200 text-gray-400 hover:border-gray-400'
                      : 'border-gray-300 text-gray-700 hover:border-[#364458]'
                  }`}
                >
                  {size.size}
                  {outOfStock && (
                    <span className="absolute inset-0 pointer-events-none">
                      <svg width="100%" height="100%" className="absolute inset-0">
                        <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedSize && (
            <p className="mt-3 text-2xl font-black tracking-tighter">{fmt(selectedSize.price)}</p>
          )}
        </div>
      )}

      {/* Cantidad, talla agotada y agregar al carrito — solo cuando el color tiene stock */}
      {selectedVariant.in_stock && (
        <>
          {/* Cantidad */}
          {selectedSize && !atStockLimit && !sizeOutOfStock && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-3">Cantidad</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 border border-gray-300 flex items-center justify-center font-bold hover:border-[#364458] transition-colors cursor-pointer"
                >
                  −
                </button>
                <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(available, quantity + 1))}
                  className="w-9 h-9 border border-gray-300 flex items-center justify-center font-bold hover:border-[#364458] transition-colors cursor-pointer"
                >
                  +
                </button>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 ml-2">
                  {available} disponible{available !== 1 ? 's' : ''}
                  {cartQty > 0 && ` (${cartQty} en bolsa)`}
                </span>
              </div>
            </div>
          )}

          {/* Límite de stock del carrito alcanzado */}
          {atStockLimit && (
            <div className="bg-gray-50 border border-gray-200 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Ya tienes el máximo disponible en tu bolsa ({cartQty} unidad{cartQty !== 1 ? 'es' : ''})
              </p>
            </div>
          )}

          {/* Sin stock en talla — formulario de notificación */}
          {sizeOutOfStock ? (
            <div className="flex flex-col gap-3">
              <div className="bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Talla agotada
                </p>
              </div>
              {notifySent ? (
                <div className="bg-[#EEF2F6] border border-[#8AA7C4] px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-widest text-[#364458]">
                    ✓ Te avisamos cuando esté disponible
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Avísame cuando esté disponible
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
                      className="flex-1 border border-gray-300 px-3 py-3 text-xs focus:outline-none focus:border-[#364458] transition-colors"
                    />
                    <button
                      onClick={handleNotify}
                      disabled={notifyLoading || !notifyEmail}
                      className="px-4 py-3 text-xs font-black uppercase tracking-widest bg-[#364458] text-white hover:bg-[#2F3F55] disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {notifyLoading ? '...' : 'Notificar'}
                    </button>
                  </div>
                  {notifyError && (
                    <p className="text-[10px] text-red-500 font-bold">{notifyError}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Agregar al carrito */
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize || atStockLimit}
              className={`w-full py-5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                !selectedSize || atStockLimit
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : added
                  ? 'bg-[#8AA7C4] text-black'
                  : 'bg-[#364458] text-white hover:bg-[#2F3F55]'
              }`}
            >
              {!selectedSize
                ? 'Selecciona una Talla'
                : atStockLimit
                ? 'Sin más existencias'
                : added
                ? '✓ Añadido a la Bolsa'
                : 'Añadir a la Bolsa'}
            </button>
          )}
        </>
      )}

      <button
        onClick={() => router.push('/carrito')}
        className="w-full py-4 text-xs font-black uppercase tracking-widest border border-gray-300 hover:border-[#364458] transition-colors cursor-pointer"
      >
        Ver Bolsa
      </button>
    </div>
  )
}
