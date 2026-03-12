'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types/product'
import ProductSwatches from './ProductSwatches'
export { colorToHex } from '@/lib/colorToHex'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)
  const [hoveredIsOos, setHoveredIsOos] = useState(false)

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const priceLabel =
    product.min_price === product.max_price
      ? fmt(product.min_price)
      : `${fmt(product.min_price)} – ${fmt(product.max_price)}`

  return (
    <Link href={`/catalogo/${product.product_id}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-gray-100 mb-4">
        {/* Primary image — always rendered */}
        {product.primary_image && (
          <Image
            src={product.primary_image}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover group-hover:scale-105 transition-all duration-500 ${
              hoveredIsOos ? 'opacity-40' : 'opacity-100'
            }`}
          />
        )}
        {/* Hovered color image — fades in on top */}
        {hoveredImage && hoveredImage !== product.primary_image && (
          <Image
            key={hoveredImage}
            src={hoveredImage}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-opacity duration-300 opacity-100"
          />
        )}
        {!product.primary_image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {product.variants.length > 1 && (
          <span className="absolute bottom-3 left-3 bg-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">
            {product.variants.length} Colores
          </span>
        )}
      </div>

      {/* Info */}
      <h3 className="font-bold text-xs uppercase tracking-tight line-clamp-2 group-hover:underline">
        {product.product_name}
      </h3>
      {product.brand && (
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{product.brand}</p>
      )}
      <p className="text-sm font-bold text-gray-600 mt-1">{priceLabel}</p>

      {/* Color swatches — always visible */}
      <div>
        <ProductSwatches
          variants={product.variants}
          productId={product.product_id}
          productName={product.product_name}
          onSwatchHover={(imageUrl, isOos) => {
            setHoveredImage(imageUrl)
            setHoveredIsOos(isOos && imageUrl !== null)
          }}
        />
      </div>
    </Link>
  )
}

