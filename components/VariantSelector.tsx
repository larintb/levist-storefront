'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, ProductVariant, ProductSize } from '@/types/product'
import { addToCart, getCart } from '@/lib/cart'

interface Props {
  product: Product
}

export default function VariantSelector({ product }: Props) {
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0])
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  // Cuántas unidades de este inventory_id ya están en el carrito
  const cartQty = selectedSize
    ? (getCart().find((i) => i.inventory_id === selectedSize.inventory_id)?.quantity ?? 0)
    : 0

  // Cuántas se pueden agregar todavía
  const available = selectedSize ? Math.max(0, selectedSize.stock - cartQty) : 0

  useEffect(() => {
    setSelectedSize(null)
    setQuantity(1)
  }, [selectedVariant])

  // Al cambiar de talla, resetear cantidad respetando disponibilidad
  useEffect(() => {
    if (selectedSize) setQuantity(1)
  }, [selectedSize])

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
    setTimeout(() => setAdded(false), 2000)
  }

  const atStockLimit = selectedSize !== null && available <= 0

  return (
    <div className="flex flex-col gap-6">

      {/* Color */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest mb-3">
          Color: <span className="font-normal text-gray-500">{selectedVariant.color}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => (
            <button
              key={variant.variant_key}
              onClick={() => setSelectedVariant(variant)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                variant.variant_key === selectedVariant.variant_key
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 text-gray-700 hover:border-black'
              }`}
            >
              {variant.color}
            </button>
          ))}
        </div>
      </div>

      {/* Talla */}
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
            const outOfStock = size.stock <= 1
            const isSelected = selectedSize?.inventory_id === size.inventory_id
            return (
              <button
                key={size.inventory_id}
                onClick={() => !outOfStock && setSelectedSize(size)}
                disabled={outOfStock}
                className={`min-w-[48px] px-3 py-2 text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : outOfStock
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                    : 'border-gray-300 text-gray-700 hover:border-black'
                }`}
              >
                {size.size}
              </button>
            )
          })}
        </div>

        {selectedSize && (
          <p className="mt-3 text-2xl font-black tracking-tighter">{fmt(selectedSize.price)}</p>
        )}
      </div>

      {/* Cantidad */}
      {selectedSize && !atStockLimit && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-3">Cantidad</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 border border-gray-300 flex items-center justify-center font-bold hover:border-black transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="font-bold text-sm w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(available, quantity + 1))}
              className="w-9 h-9 border border-gray-300 flex items-center justify-center font-bold hover:border-black transition-colors cursor-pointer"
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

      {/* Límite de stock alcanzado */}
      {atStockLimit && (
        <div className="bg-gray-50 border border-gray-200 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
            Ya tienes el máximo disponible en tu bolsa ({cartQty} unidad{cartQty !== 1 ? 'es' : ''})
          </p>
        </div>
      )}

      {/* Agregar al carrito */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedSize || atStockLimit}
        className={`w-full py-5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
          !selectedSize || atStockLimit
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : added
            ? 'bg-yellow-400 text-black'
            : 'bg-black text-white hover:bg-gray-800'
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

      <button
        onClick={() => router.push('/carrito')}
        className="w-full py-4 text-xs font-black uppercase tracking-widest border border-gray-300 hover:border-black transition-colors cursor-pointer"
      >
        Ver Bolsa
      </button>
    </div>
  )
}
