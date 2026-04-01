'use client'

import { useMemo } from 'react'
import { useCatalogSearch } from '@/contexts/CatalogSearchContext'
import ProductGrid from '@/components/ProductGrid'
import type { Product } from '@/types/product'

interface Props {
  products: Product[]
  activeColor?: string
}

function matchesSearch(product: Product, query: string): boolean {
  const q = query.toLowerCase().trim()
  return (
    product.product_name.toLowerCase().includes(q) ||
    (product.sku?.toLowerCase().includes(q) ?? false)
  )
}

export default function CatalogProductsView({ products, activeColor }: Props) {
  const { query } = useCatalogSearch()

  const filtered = useMemo(() => {
    if (!query.trim()) return products
    return products.filter(p => matchesSearch(p, query))
  }, [products, query])

  if (filtered.length === 0 && query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Sin resultados para &ldquo;{query}&rdquo;
        </p>
        <p className="text-xs text-gray-400">Intenta con otro término</p>
      </div>
    )
  }

  return <ProductGrid products={filtered} activeColor={activeColor} />
}
