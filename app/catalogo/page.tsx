import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCatalogProducts, getCategories, getColors, getCollections, getBrands } from '@/lib/catalog'
import { detectCuration, getCuration } from '@/lib/curations'
import CuratedGrid from '@/components/CuratedGrid'
import CatalogProductsView from '@/components/CatalogProductsView'
import CatalogSearchInput from '@/components/CatalogSearchInput'
import CollapsibleFilterSection from '@/components/CollapsibleFilterSection'
import SortSelector from '@/components/SortSelector'
import MobileCatalogControls from '@/components/MobileCatalogControls'
import { CatalogSearchProvider } from '@/contexts/CatalogSearchContext'
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

export const revalidate = 3600

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

async function CatalogResults({
  filters,
  initialQuery,
}: {
  filters: CatalogFilters
  initialQuery: string
}) {
  const curationKey = detectCuration(initialQuery)
  if (curationKey) {
    const curation = await getCuration(curationKey)
    if (curation && curation.items.length > 0) {
      return (
        <CuratedGrid
          title={curation.title}
          subtitle={curation.subtitle}
          items={curation.items}
        />
      )
    }
  }

  const products = await getCatalogProducts(filters)
  return <CatalogProductsView products={products} activeColor={filters.color} />
}

// ─── Sidebar (sync — recibe datos del page para evitar queries duplicadas) ────

interface FilterData {
  categories: string[]
  colors: string[]
  collections: string[]
  brands: string[]
}

function CatalogSidebar({
  filters,
  params,
  filterData,
}: {
  filters: CatalogFilters
  params: Record<string, string | undefined>
  filterData: FilterData
}) {
  const { categories, colors, collections, brands } = filterData
  const hasFilters = !!(filters.category || filters.color || filters.collection || filters.brand)

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

        <CatalogSearchInput />

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

// ─── Mobile controls (sync — recibe datos del page) ──────────────────────────

function MobileCatalogControlsServer({
  filters,
  params,
  filterData,
}: {
  filters: CatalogFilters
  params: Record<string, string | undefined>
  filterData: FilterData
}) {
  const { categories, colors, collections, brands } = filterData

  const activeFilters: { label: string; href: string }[] = [
    filters.category   ? { label: `Categoría: ${filters.category}`,   href: buildUrl(params, 'category',   undefined) } : null,
    filters.brand      ? { label: `Marca: ${filters.brand}`,           href: buildUrl(params, 'brand',      undefined) } : null,
    filters.collection ? { label: `Colección: ${filters.collection}`, href: buildUrl(params, 'collection', undefined) } : null,
    filters.color      ? { label: `Color: ${filters.color}`,           href: buildUrl(params, 'color',      undefined) } : null,
  ].filter((f): f is { label: string; href: string } => f !== null)

  return (
    <MobileCatalogControls
      currentSort={filters.sort ?? 'name_asc'}
      clearHref="/catalogo"
      activeFilters={activeFilters}
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
    sort:       VALID_SORTS.includes(params.sort ?? '') ? (params.sort as SortOption) : 'name_asc',
  }

  const initialQuery = params.q?.trim() ?? ''
  const hasFilters = !!(filters.category || filters.color || filters.collection || filters.brand || initialQuery)

  // Fetch filter data ONCE — ambos componentes (sidebar + mobile) usan estos mismos datos.
  // Antes, cada uno hacía sus propias 4 queries en paralelo (thundering herd en cold start).
  const [categories, colors, collections, brands] = await Promise.all([
    getCategories(),
    getColors(),
    getCollections(),
    getBrands(),
  ])
  const filterData: FilterData = { categories, colors, collections, brands }

  return (
    <CatalogSearchProvider initialQuery={initialQuery}>
      <div className="max-w-7xl mx-auto">
        {/* Mobile sticky sort/filter bar */}
        <MobileCatalogControlsServer filters={filters} params={params} filterData={filterData} />

        <div className={`px-6 pb-10 lg:pt-10 ${hasFilters ? 'pt-[72px]' : 'pt-[36px]'}`}>
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
              <div className="hidden lg:flex flex-wrap gap-2 mt-3">
                {filters.category   && <Chip label={`Categoría: ${filters.category}`}   href={buildUrl(params, 'category',   undefined)} />}
                {filters.brand      && <Chip label={`Marca: ${filters.brand}`}           href={buildUrl(params, 'brand',      undefined)} />}
                {filters.collection && <Chip label={`Colección: ${filters.collection}`} href={buildUrl(params, 'collection', undefined)} />}
                {filters.color      && <Chip label={`Color: ${filters.color}`}           href={buildUrl(params, 'color',      undefined)} />}
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar desktop — sync, datos ya disponibles */}
            <CatalogSidebar filters={filters} params={params} filterData={filterData} />

            {/* Grid — sigue siendo async/streaming */}
            <div className="flex-1">
              <Suspense fallback={<GridSkeleton />}>
                <CatalogResults filters={filters} initialQuery={initialQuery} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </CatalogSearchProvider>
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
