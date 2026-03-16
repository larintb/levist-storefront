'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/types/product'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'

interface Props {
  product: Product
  initialColor?: string
  isBordado?: boolean
}

export default function ProductPageClient({ product, initialColor, isBordado }: Props) {
  const [selectedVariantKey, setSelectedVariantKey] = useState(() => {
    if (initialColor) {
      const key = initialColor.toLowerCase().trim()
      const match =
        product.variants.find(v => v.color.toLowerCase().trim() === key) ??
        product.variants.find(v => v.color.toLowerCase().includes(key))
      if (match) return match.variant_key
    }
    return (
      product.variants.find(v => v.color !== 'ADO' && v.in_stock)
      ?? product.variants.find(v => v.color !== 'ADO')
      ?? product.variants[0]
    )?.variant_key ?? ''
  })

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const priceLabel = isBordado
    ? fmt(80)
    : product.min_price === product.max_price
      ? fmt(product.min_price)
      : `${fmt(product.min_price)} – ${fmt(product.max_price)}`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
      {/* Gallery */}
      <ProductGallery
        variants={product.variants}
        selectedVariantKey={selectedVariantKey}
      />

      {/* Info */}
      <div className="flex flex-col gap-6">
        {/* Marca / Categoría / Colección */}
        <div className="flex flex-wrap gap-2">
          {product.brand && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#8AA7C4] px-2 py-1">
              {product.brand}
            </span>
          )}
          {product.category && (
            <span className="text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 text-gray-500">
              {product.category}
            </span>
          )}
          {product.collection && (
            <span className="text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 text-gray-500">
              {product.collection}
            </span>
          )}
        </div>

        {/* Nombre y precio */}
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-tight">
            {product.product_name}
          </h1>
          <p className="text-2xl font-bold text-gray-600 mt-2">{priceLabel}</p>
        </div>

        {/* Stats */}
        {!isBordado && (
          <div className="border-y border-gray-100 py-4 flex gap-6 text-[10px] uppercase tracking-widest font-bold text-gray-400">
            <span>
              <span className="text-black">{product.variants.length}</span>{' '}
              Color{product.variants.length > 1 ? 'es' : ''}
            </span>
            <span>
              <span className="text-black">
                {new Set(product.variants.flatMap((v) => v.sizes.map((s) => s.size))).size}
              </span>{' '}
              Tallas
            </span>
            {product.sku && (
              <span>
                SKU <span className="text-black font-mono">{product.sku}</span>
              </span>
            )}
          </div>
        )}

        {/* Selector de variante o botón de bordado */}
        {isBordado ? (
          <Link
            href="/bordado"
            className="w-full py-5 bg-[#364458] text-white text-center text-sm font-black uppercase tracking-widest hover:bg-[#2F3F55] active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(54,68,88,0.3)] block"
          >
            Personalizar Bordado →
          </Link>
        ) : (
          <VariantSelector
            product={product}
            initialVariantKey={selectedVariantKey}
            onVariantChange={setSelectedVariantKey}
          />
        )}
      </div>
    </div>
  )
}
