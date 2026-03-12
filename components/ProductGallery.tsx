'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { ProductVariant } from '@/types/product'

interface Props {
  variants: ProductVariant[]
  selectedVariantKey: string
}

export default function ProductGallery({ variants, selectedVariantKey }: Props) {
  const initial = variants.find((v) => v.variant_key === selectedVariantKey) ?? variants[0]
  const [activeImage, setActiveImage] = useState(initial?.image_url ?? null)

  // Sync image when the selected color changes from the parent
  useEffect(() => {
    const variant = variants.find((v) => v.variant_key === selectedVariantKey)
    if (variant?.image_url) setActiveImage(variant.image_url)
  }, [selectedVariantKey, variants])

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {activeImage ? (
          <Image
            src={activeImage}
            alt="Producto"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Thumbnails — solo si hay más de un color con imagen */}
      {variants.filter((v) => v.image_url).length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {variants.filter((v) => v.image_url).map((variant) => (
            <button
              key={variant.variant_key}
              onClick={() => setActiveImage(variant.image_url)}
              className={`relative flex-shrink-0 w-16 h-20 overflow-hidden border-2 transition-all cursor-pointer ${
                activeImage === variant.image_url
                  ? 'border-black'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              title={variant.color}
            >
              <Image
                src={variant.image_url!}
                alt={variant.color}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
