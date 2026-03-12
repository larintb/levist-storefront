'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { CartItem } from '@/types/product'
import type { FitProduct } from '@/app/api/complete-fit/route'
import { addToCart } from '@/lib/cart'

interface Props {
  cartItems: CartItem[]
  onCartUpdate: () => void
}

const isPant  = (n: string) => /pant/i.test(n)
const isSet   = (n: string) => /\bset\b/i.test(n)
const isBata  = (n: string) => /bata|lab.?coat/i.test(n)
const isTop   = (n: string) => !isPant(n) && !isSet(n) && !isBata(n)

const fmt = (p: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p)

// ─── Mini card ─────────────────────────────────────────────────────────────────

function FitCard({
  product,
  preSize,
  onAdded,
}: {
  product: FitProduct
  preSize?: string
  onAdded: () => void
}) {
  const initial = product.sizes.find(s => s.size === preSize) ?? product.sizes[0]
  const [selectedId, setSelectedId] = useState<string | null>(initial?.inventory_id ?? null)
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
    <div className="bg-white/5 rounded-xl p-3 flex gap-3">
      <div className="relative w-14 flex-shrink-0 rounded-lg overflow-hidden bg-white/10" style={{ height: '72px' }}>
        {product.image_url
          ? <Image src={product.image_url} alt={product.product_name} fill className="object-cover" sizes="56px" />
          : <div className="absolute inset-0 bg-white/10 rounded-lg" />
        }
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link
            href={`/catalogo/${product.product_id}?color=${encodeURIComponent(product.color)}`}
            className="text-[10px] font-black uppercase tracking-tight line-clamp-2 text-white leading-tight hover:text-[#8AA7C4] transition-colors"
          >{product.product_name}</Link>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {product.sizes.map(s => (
              <button
                key={s.inventory_id}
                onClick={() => setSelectedId(s.inventory_id)}
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md transition-all cursor-pointer border ${
                  selectedId === s.inventory_id
                    ? 'bg-white text-[#364458] border-white'
                    : 'bg-transparent text-white/50 border-white/20 hover:border-white/50 hover:text-white/80'
                }`}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-black text-white">
            {fmt(selectedSize?.price ?? product.min_price)}
          </span>
          <button
            onClick={handleAdd}
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

// ─── Main component ────────────────────────────────────────────────────────────

export default function CompleteYourFit({ cartItems, onCartUpdate }: Props) {
  const [products, setProducts] = useState<FitProduct[]>([])
  const [label, setLabel] = useState('')
  const prevKey = useRef<string | null>(null)

  // Find the first qualifying item in cart
  const trigger = cartItems.find(item =>
    isTop(item.product_name) || isBata(item.product_name)
  )

  const alreadyHasPant = trigger
    ? cartItems.some(item => isPant(item.product_name) && item.color.toLowerCase() === trigger.color.toLowerCase())
    : false

  const fetchKey = trigger && !alreadyHasPant
    ? `${trigger.product_name}|${trigger.color}|${trigger.product_id}`
    : null

  useEffect(() => {
    if (!fetchKey || !trigger) { setProducts([]); return }
    if (fetchKey === prevKey.current) return
    prevKey.current = fetchKey
    setProducts([])

    const productType = isBata(trigger.product_name) ? 'bata' : 'top'

    if (productType === 'bata') {
      setLabel('Completa tu look de bata')
      // Fetch white top + white pant in parallel
      Promise.all([
        fetch(`/api/complete-fit?find=white_top&exclude=${trigger.product_id}`).then(r => r.json()),
        fetch(`/api/complete-fit?find=white_pant&exclude=${trigger.product_id}`).then(r => r.json()),
      ]).then(([top, pant]) => {
        setProducts([top, pant].filter(Boolean) as FitProduct[])
      }).catch(() => setProducts([]))

    } else {
      setLabel('Complete Your Fit')
      fetch(`/api/complete-fit?find=pant&color=${encodeURIComponent(trigger.color)}&exclude=${trigger.product_id}`)
        .then(r => r.json())
        .then((data: FitProduct[]) => setProducts(Array.isArray(data) ? data : []))
        .catch(() => setProducts([]))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey])

  if (!products.length || !trigger) return null

  const preSize = trigger.size

  return (
    <div className="mx-3 mb-3 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #2a3f55 60%, #1e3048 100%)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">⚡</span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8AA7C4]">Para completar</p>
            <p className="text-sm font-black uppercase tracking-tight text-white leading-tight">{label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1">
          <div className="w-2 h-2 rounded-full bg-[#8AA7C4]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
            {isBata(trigger.product_name) ? 'White' : trigger.color}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="px-3 pb-3 flex flex-col gap-2">
        {products.map(p => (
          <FitCard key={p.product_id} product={p} preSize={preSize} onAdded={onCartUpdate} />
        ))}
      </div>
    </div>
  )
}
