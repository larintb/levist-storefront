'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types/product'
import ProductSwatches from './ProductSwatches'
export { colorToHex } from '@/lib/colorToHex'

interface Props {
  product: Product
  activeColor?: string
}

const CYCLE_INTERVAL = 1600 // ms per color

export default function ProductCard({ product, activeColor }: Props) {
  const [cycleIndex, setCycleIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeVariant = activeColor
    ? (product.variants.find(v => v.color.toLowerCase().trim() === activeColor.toLowerCase().trim())
      ?? product.variants.find(v => v.color.toLowerCase().includes(activeColor.toLowerCase().trim())))
    : undefined
  const defaultImage = activeVariant?.image_url ?? product.primary_image

  // Only cycle in-stock variants that have an image
  const cyclable = product.variants.filter(v => v.in_stock && v.image_url)

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const priceLabel =
    product.min_price === product.max_price
      ? fmt(product.min_price)
      : `${fmt(product.min_price)} – ${fmt(product.max_price)}`

  const href = activeColor
    ? `/catalogo/${product.product_id}?color=${encodeURIComponent(activeColor)}`
    : `/catalogo/${product.product_id}`

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isHovering && cyclable.length > 1) {
      setCycleIndex(0)
      intervalRef.current = setInterval(() => {
        setCycleIndex(prev => (prev + 1) % cyclable.length)
      }, CYCLE_INTERVAL)
    } else {
      setCycleIndex(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering, cyclable.length])

  const inStockCount = product.variants.filter(v => v.in_stock).length

  return (
    <Link
      href={href}
      className="group block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-gray-100 mb-4">

        {/* Base image — always underneath */}
        {defaultImage ? (
          <Image
            src={defaultImage}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* All cyclable images pre-rendered — opacity-only toggle, no remount */}
        {cyclable.map((variant, i) => (
          <Image
            key={variant.variant_key}
            src={variant.image_url!}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover group-hover:scale-105 transition-all duration-700 ${
              isHovering && i === cycleIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {inStockCount > 1 && (
          <span className="absolute bottom-3 left-3 bg-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">
            {inStockCount} Colores
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

      <div>
        <ProductSwatches
          variants={product.variants}
          productId={product.product_id}
          productName={product.product_name}
        />
      </div>
    </Link>
  )
}
