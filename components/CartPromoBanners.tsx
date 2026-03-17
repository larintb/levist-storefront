'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { CartItem } from '@/types/product'
import type { FitProduct } from '@/app/api/complete-fit/route'
import { addToCart } from '@/lib/cart'

const fmt = (p: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p)

// Given the cart sizes and product sizes, return the inventory_id to pre-select
function resolveInitialId(productSizes: FitProduct['sizes'], cartSizes: string[]): string | null {
  for (const cs of cartSizes) {
    const match = productSizes.find(s => s.size.toUpperCase() === cs.toUpperCase())
    if (match) return match.inventory_id
  }
  return productSizes[0]?.inventory_id ?? null
}

// ─── Dark card (drawer) ────────────────────────────────────────────────────────

function DarkCard({
  product,
  cartSizes,
  onAdded,
}: {
  product: FitProduct
  cartSizes: string[]
  onAdded: () => void
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(
    () => resolveInitialId(product.sizes, cartSizes)
  )
  const [added, setAdded] = useState(false)

  const selectedSize = product.sizes.find(s => s.inventory_id === selectedId)

  function handleAdd() {
    if (!selectedSize) return
    addToCart({
      product_id:   product.product_id,
      product_name: product.product_name,
      variant_key:  `${product.product_id}|${product.color}`,
      inventory_id: selectedSize.inventory_id,
      color:        product.color,
      size:         selectedSize.size,
      price:        selectedSize.price,
      quantity:     1,
      stock:        selectedSize.stock,
      image_url:    product.image_url,
    })
    window.dispatchEvent(new Event('cart-updated'))
    window.dispatchEvent(new CustomEvent('cart-added', {
      detail: { name: product.product_name, color: product.color, size: selectedSize.size },
    }))
    onAdded()
    setAdded(true)
  }

  return (
    <div
      className="bg-white/5 rounded-xl p-3 flex gap-3 cursor-pointer group/card hover:bg-white/10 transition-colors"
      onClick={() => router.push(`/catalogo/${product.product_id}?color=${encodeURIComponent(product.color)}`)}
    >
      <div className="relative w-14 flex-shrink-0 rounded-lg overflow-hidden bg-white/10" style={{ height: '72px' }}>
        {product.image_url
          ? <Image src={product.image_url} alt={product.product_name} fill className="object-cover group-hover/card:scale-105 transition-transform duration-300" sizes="56px" />
          : <div className="absolute inset-0 bg-white/10 rounded-lg" />
        }
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-tight line-clamp-2 text-white leading-tight group-hover/card:text-[#8AA7C4] transition-colors">
            {product.product_name}
          </span>
          <p className="text-[9px] text-white/35 mt-0.5">{product.color}</p>
          <div className="flex flex-wrap gap-1 mt-1.5" onClick={e => e.stopPropagation()}>
            {product.sizes.map(s => {
              const isCart = cartSizes.some(cs => cs.toUpperCase() === s.size.toUpperCase())
              const isSelected = selectedId === s.inventory_id
              return (
                <button
                  key={s.inventory_id}
                  onClick={() => setSelectedId(s.inventory_id)}
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-[#364458] border-white'
                      : isCart
                      ? 'bg-[#8AA7C4]/15 text-[#8AA7C4] border-[#8AA7C4]/50 hover:border-[#8AA7C4] hover:bg-[#8AA7C4]/25'
                      : 'bg-transparent text-white/40 border-white/15 hover:border-white/40 hover:text-white/70'
                  }`}
                >
                  {s.size}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-black text-white">
            {fmt(selectedSize?.price ?? product.min_price)}
          </span>
          <button
            onClick={e => { e.stopPropagation(); handleAdd() }}
            disabled={!selectedId || added}
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
              added
                ? 'bg-[#8AA7C4] text-[#1a2a3a] cursor-default'
                : selectedId
                ? 'bg-white text-[#364458] hover:bg-[#8AA7C4] cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {added ? '✓ Listo' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Light card (page) ─────────────────────────────────────────────────────────

function LightCard({
  product,
  cartSizes,
  onAdded,
}: {
  product: FitProduct
  cartSizes: string[]
  onAdded: () => void
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(
    () => resolveInitialId(product.sizes, cartSizes)
  )
  const [added, setAdded] = useState(false)

  const selectedSize = product.sizes.find(s => s.inventory_id === selectedId)

  function handleAdd() {
    if (!selectedSize) return
    addToCart({
      product_id:   product.product_id,
      product_name: product.product_name,
      variant_key:  `${product.product_id}|${product.color}`,
      inventory_id: selectedSize.inventory_id,
      color:        product.color,
      size:         selectedSize.size,
      price:        selectedSize.price,
      quantity:     1,
      stock:        selectedSize.stock,
      image_url:    product.image_url,
    })
    window.dispatchEvent(new Event('cart-updated'))
    window.dispatchEvent(new CustomEvent('cart-added', {
      detail: { name: product.product_name, color: product.color, size: selectedSize.size },
    }))
    onAdded()
    setAdded(true)
  }

  return (
    <div
      className="border border-gray-100 bg-white flex flex-col cursor-pointer group/card hover:border-[#364458]/20 transition-colors overflow-hidden"
      onClick={() => router.push(`/catalogo/${product.product_id}?color=${encodeURIComponent(product.color)}`)}
    >
      {/* Image */}
      <div className="relative w-full bg-gray-100 overflow-hidden" style={{ aspectRatio: '3/4' }}>
        {product.image_url
          ? <Image src={product.image_url} alt={product.product_name} fill className="object-cover group-hover/card:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 200px" />
          : <div className="absolute inset-0 bg-gray-200" />
        }
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-tight line-clamp-2 text-[#364458] leading-tight group-hover/card:text-[#364458]/70 transition-colors">
            {product.product_name}
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-widest">{product.color}</p>
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
          {product.sizes.map(s => {
            const isCart = cartSizes.some(cs => cs.toUpperCase() === s.size.toUpperCase())
            const isSelected = selectedId === s.inventory_id
            return (
              <button
                key={s.inventory_id}
                onClick={() => setSelectedId(s.inventory_id)}
                className={`text-[9px] font-black px-1.5 py-0.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#364458] text-white border-[#364458]'
                    : isCart
                    ? 'bg-[#364458]/8 text-[#364458] border-[#364458]/40 hover:border-[#364458] hover:bg-[#364458]/15'
                    : 'bg-white text-gray-300 border-gray-200 hover:border-gray-400 hover:text-gray-500'
                }`}
              >
                {s.size}
              </button>
            )
          })}
        </div>

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-black text-[#364458]">
            {fmt(selectedSize?.price ?? product.min_price)}
          </span>
          <button
            onClick={e => { e.stopPropagation(); handleAdd() }}
            disabled={!selectedId || added}
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 transition-all ${
              added
                ? 'bg-[#8AA7C4] text-white cursor-default'
                : selectedId
                ? 'bg-[#364458] text-white hover:bg-[#2F3F55] cursor-pointer'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {added ? '✓ Listo' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Cart detection helpers ────────────────────────────────────────────────────

const isBata    = (n: string) => /bata|lab.?coat/i.test(n)
const isJacket  = (n: string) => /jacket|chamarra/i.test(n)
const isSet     = (n: string) => /\bset\b/i.test(n)
const isScrub   = (n: string) => !isBata(n) && !isJacket(n) && !isSet(n)

interface RecoConfig {
  find: string   // comma-separated find types for the API
  label: string
}

function detectRecoConfig(cartItems: CartItem[]): RecoConfig {
  const productItems  = cartItems.filter(i => i.item_type !== 'embroidery')
  const hasEmbroidery = cartItems.some(i => i.item_type === 'embroidery')
  const hasJacket     = productItems.some(i => isJacket(i.product_name))
  const hasBata       = productItems.some(i => isBata(i.product_name))
  const hasScrub      = productItems.some(i => isScrub(i.product_name))

  if (hasEmbroidery) return { find: 'scrub,bata',    label: 'Para tu bordado' }
  if (hasJacket)     return { find: 'set,bata',       label: 'Completa tu look' }
  if (hasBata)       return { find: 'scrub,jacket',   label: 'También te puede gustar' }
  if (hasScrub)      return { find: 'bata,jacket',    label: 'También te puede gustar' }
  return               { find: 'default',             label: 'También te puede gustar' }
}

// ─── Main component ────────────────────────────────────────────────────────────

interface Props {
  variant: 'drawer' | 'page'
  cartItems: CartItem[]
  onCartUpdate: () => void
}

export default function CartPromoBanners({ variant, cartItems, onCartUpdate }: Props) {
  const [products, setProducts] = useState<FitProduct[]>([])
  const fetchedRef = useRef(false)

  // Unique sizes present in the cart (excluding embroidery items)
  const cartSizes = [...new Set(
    cartItems.filter(i => i.item_type !== 'embroidery').map(i => i.size)
  )]

  const { find, label } = detectRecoConfig(cartItems)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const excludeIds = [...new Set(cartItems.map(i => i.product_id))].join(',')
    const limit = variant === 'drawer' ? 4 : 6
    const params = new URLSearchParams({ find, limit: String(limit) })
    if (excludeIds) params.set('exclude', excludeIds)

    fetch(`/api/promo-products?${params}`)
      .then(r => r.json())
      .then((data: FitProduct[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!products.length) return null

  if (variant === 'drawer') {
    return (
      <div className="px-6 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">{label}</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="flex flex-col gap-2">
          {products.map(p => (
            <DarkCard key={p.product_id} product={p} cartSizes={cartSizes} onAdded={onCartUpdate} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gray-100" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">{label}</p>
        <div className="h-px flex-1 bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map(p => (
          <LightCard key={p.product_id} product={p} cartSizes={cartSizes} onAdded={onCartUpdate} />
        ))}
      </div>
    </div>
  )
}
