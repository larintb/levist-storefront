import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCatalogProducts, getCategories, getColors, getCollections, getBrands } from '@/lib/catalog'
import ProductGrid from '@/components/ProductGrid'
import CollapsibleFilterSection from '@/components/CollapsibleFilterSection'
import SortSelector from '@/components/SortSelector'
import MobileCatalogControls from '@/components/MobileCatalogControls'
import type { CatalogFilters, SortOption } from '@/types/product'

export const metadata: Metadata = {
  title: 'Catálogo de Uniformes',
  description: 'Explora nuestra colección completa de scrubs, pijamas clínicas, filipinas y batas de laboratorio con bordado personalizado.',
  openGraph: {
    title: 'Catálogo de Uniformes | LEVIST',
    description: 'Scrubs, pijamas clínicas, filipinas y batas de laboratorio con bordado personalizado.',
    type: 'website',
  },
}

export const revalidate = 300

interface PageProps {
  searchParams: Promise<{ category?: string; color?: string; collection?: string; brand?: string; q?: string; sort?: string }>
}

// ─── Skeleton del grid ────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i}>
          <div className="bg-gray-100 aspect-[3/4] w-full animate-pulse mb-3" />
          <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ─── Grid de productos (async, en su propio Suspense) ─────────────────────────

async function CatalogResults({ filters }: { filters: CatalogFilters }) {
  const products = await getCatalogProducts(filters)
  return <ProductGrid products={products} activeColor={filters.color} />
}

// ─── Sidebar (async, datos cacheados) ────────────────────────────────────────

async function CatalogSidebar({
  filters,
  params,
}: {
  filters: CatalogFilters
  params: Record<string, string | undefined>
}) {
  const [categories, colors, collections, brands] = await Promise.all([
    getCategories(),
    getColors(),
    getCollections(),
    getBrands(),
  ])

  const hasFilters = !!(filters.category || filters.color || filters.collection || filters.brand || filters.search)

  return (
    <aside className="hidden lg:block w-48 flex-shrink-0">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest">Filtros</h2>
          {hasFilters && (
            <Link href="/catalogo" className="text-[10px] font-bold uppercase tracking-widest underline text-gray-400 hover:text-[#364458]">
              Limpiar
            </Link>
          )}
        </div>

        {/* Search */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Buscar</p>
          <form action="/catalogo" method="GET">
            {filters.category   && <input type="hidden" name="category"   value={filters.category} />}
            {filters.color      && <input type="hidden" name="color"      value={filters.color} />}
            {filters.collection && <input type="hidden" name="collection" value={filters.collection} />}
            {filters.brand      && <input type="hidden" name="brand"      value={filters.brand} />}
            <input
              type="text"
              name="q"
              defaultValue={filters.search ?? ''}
              placeholder="Nombre del producto..."
              className="w-full border-b border-gray-300 pb-1 text-xs focus:outline-none focus:border-[#364458] font-bold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
            />
          </form>
        </div>

        {categories.length > 0 && (
          <CollapsibleFilterSection
            title="Categoría"
            items={categories.map((item) => ({
              label: item,
              active: filters.category === item,
              href: buildUrl(params, 'category', filters.category === item ? undefined : item),
            }))}
          />
        )}

        {brands.length > 0 && (
          <CollapsibleFilterSection
            title="Marca"
            items={brands.map((item) => ({
              label: item,
              active: filters.brand === item,
              href: buildUrl(params, 'brand', filters.brand === item ? undefined : item),
            }))}
          />
        )}

        {collections.length > 0 && (
          <CollapsibleFilterSection
            title="Colección"
            items={collections.map((item) => ({
              label: item,
              active: filters.collection === item,
              href: buildUrl(params, 'collection', filters.collection === item ? undefined : item),
            }))}
          />
        )}

        {colors.length > 0 && (
          <CollapsibleFilterSection
            title="Color"
            items={colors.map((item) => ({
              label: item,
              active: filters.color === item,
              href: buildUrl(params, 'color', filters.color === item ? undefined : item),
            }))}
          />
        )}
      </div>
    </aside>
  )
}

// ─── Mobile controls (server wrapper → client component) ──────────────────────

async function MobileCatalogControlsServer({
  filters,
  params,
}: {
  filters: CatalogFilters
  params: Record<string, string | undefined>
}) {
  const [categories, colors, collections, brands] = await Promise.all([
    getCategories(),
    getColors(),
    getCollections(),
    getBrands(),
  ])

  return (
    <MobileCatalogControls
      currentSort={filters.sort ?? 'name_asc'}
      clearHref="/catalogo"
      categories={categories.map(item => ({
        label: item,
        active: filters.category === item,
        href: buildUrl(params, 'category', filters.category === item ? undefined : item),
      }))}
      brands={brands.map(item => ({
        label: item,
        active: filters.brand === item,
        href: buildUrl(params, 'brand', filters.brand === item ? undefined : item),
      }))}
      collections={collections.map(item => ({
        label: item,
        active: filters.collection === item,
        href: buildUrl(params, 'collection', filters.collection === item ? undefined : item),
      }))}
      colors={colors.map(item => ({
        label: item,
        active: filters.color === item,
        href: buildUrl(params, 'color', filters.color === item ? undefined : item),
      }))}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams

  const VALID_SORTS = ['name_asc', 'name_desc', 'price_asc', 'price_desc']
  const filters: CatalogFilters = {
    category:   params.category,
    color:      params.color,
    collection: params.collection,
    brand:      params.brand,
    search:     params.q,
    sort:       VALID_SORTS.includes(params.sort ?? '') ? (params.sort as SortOption) : 'name_asc',
  }

  const hasFilters = !!(filters.category || filters.color || filters.collection || filters.brand || filters.search)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile sticky sort/filter bar */}
      <Suspense fallback={null}>
        <MobileCatalogControlsServer filters={filters} params={params} />
      </Suspense>

      <div className="px-6 pb-10 pt-[46px] lg:pt-10">
        {/* Header */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Catálogo</h1>
            <div className="hidden lg:block">
              <Suspense fallback={null}>
                <SortSelector current={filters.sort} />
              </Suspense>
            </div>
          </div>
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.category   && <Chip label={`Categoría: ${filters.category}`}   href={buildUrl(params, 'category',   undefined)} />}
              {filters.brand      && <Chip label={`Marca: ${filters.brand}`}           href={buildUrl(params, 'brand',      undefined)} />}
              {filters.collection && <Chip label={`Colección: ${filters.collection}`} href={buildUrl(params, 'collection', undefined)} />}
              {filters.color      && <Chip label={`Color: ${filters.color}`}           href={buildUrl(params, 'color',      undefined)} />}
              {filters.search     && <Chip label={`"${filters.search}"`}               href={buildUrl(params, 'q',         undefined)} />}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar desktop only — datos cacheados, carga rápido */}
          <Suspense fallback={<div className="hidden lg:block lg:w-48 flex-shrink-0" />}>
            <CatalogSidebar filters={filters} params={params} />
          </Suspense>

          {/* Grid — más pesado, muestra skeleton mientras carga */}
          <div className="flex-1">
            <Suspense fallback={<GridSkeleton />}>
              <CatalogResults filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function Chip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-3 py-1 bg-[#364458] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors"
    >
      {label} ×
    </Link>
  )
}

function buildUrl(current: Record<string, string | undefined>, key: string, value: string | undefined): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...current, [key]: value })) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return `/catalogo${qs ? `?${qs}` : ''}`
}
