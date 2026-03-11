import type { Metadata } from 'next'
import Link from 'next/link'
import { getCatalogProducts, getCategories, getColors, getCollections, getBrands } from '@/lib/catalog'
import ProductGrid from '@/components/ProductGrid'
import type { CatalogFilters } from '@/types/product'

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Explora nuestro catálogo completo de uniformes médicos.',
}

export const revalidate = 300

interface PageProps {
  searchParams: Promise<{ category?: string; color?: string; collection?: string; brand?: string; q?: string }>
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: CatalogFilters = {
    category: params.category,
    color: params.color,
    collection: params.collection,
    brand: params.brand,
    search: params.q,
  }

  const [products, categories, colors, collections, brands] = await Promise.all([
    getCatalogProducts(filters),
    getCategories(),
    getColors(),
    getCollections(),
    getBrands(),
  ])

  const hasFilters = !!(filters.category || filters.color || filters.collection || filters.brand || filters.search)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Catálogo</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-bold">
          {products.length} producto{products.length !== 1 ? 's' : ''} disponibles
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-48 flex-shrink-0">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest">Filtros</h2>
              {hasFilters && (
                <Link href="/catalogo" className="text-[10px] font-bold uppercase tracking-widest underline text-gray-400 hover:text-black">
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
                  className="w-full border-b border-gray-300 pb-1 text-xs focus:outline-none focus:border-black font-bold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
                />
              </form>
            </div>

            {categories.length > 0 && (
              <FilterSection title="Categoría">
                {categories.map((item) => (
                  <FilterLink key={item} label={item} active={filters.category === item}
                    href={buildUrl(params, 'category', filters.category === item ? undefined : item)} />
                ))}
              </FilterSection>
            )}

            {brands.length > 0 && (
              <FilterSection title="Marca">
                {brands.map((item) => (
                  <FilterLink key={item} label={item} active={filters.brand === item}
                    href={buildUrl(params, 'brand', filters.brand === item ? undefined : item)} />
                ))}
              </FilterSection>
            )}

            {collections.length > 0 && (
              <FilterSection title="Colección">
                {collections.map((item) => (
                  <FilterLink key={item} label={item} active={filters.collection === item}
                    href={buildUrl(params, 'collection', filters.collection === item ? undefined : item)} />
                ))}
              </FilterSection>
            )}

            {colors.length > 0 && (
              <FilterSection title="Color">
                {colors.map((item) => (
                  <FilterLink key={item} label={item} active={filters.color === item}
                    href={buildUrl(params, 'color', filters.color === item ? undefined : item)} />
                ))}
              </FilterSection>
            )}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-8">
              {filters.category   && <Chip label={`Categoría: ${filters.category}`}   href={buildUrl(params, 'category',   undefined)} />}
              {filters.brand      && <Chip label={`Marca: ${filters.brand}`}           href={buildUrl(params, 'brand',      undefined)} />}
              {filters.collection && <Chip label={`Colección: ${filters.collection}`} href={buildUrl(params, 'collection', undefined)} />}
              {filters.color      && <Chip label={`Color: ${filters.color}`}           href={buildUrl(params, 'color',      undefined)} />}
              {filters.search     && <Chip label={`"${filters.search}"`}               href={buildUrl(params, 'q',         undefined)} />}
            </div>
          )}
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{title}</p>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

function FilterLink({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <li>
      <Link
        href={href}
        className={`block text-xs py-0.5 transition-colors ${
          active ? 'font-black text-black underline' : 'text-gray-500 hover:text-black font-bold'
        }`}
      >
        {label}
      </Link>
    </li>
  )
}

function Chip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
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
