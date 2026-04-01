'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCatalogSearch } from '@/contexts/CatalogSearchContext'
import type { SortOption } from '@/types/product'

interface FilterItem {
  label: string
  href: string
  active: boolean
}

interface Props {
  categories: FilterItem[]
  brands: FilterItem[]
  collections: FilterItem[]
  colors: FilterItem[]
  clearHref: string
  currentSort: string
  activeFilters?: { label: string; href: string }[]
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc',   label: 'Nombre A → Z' },
  { value: 'name_desc',  label: 'Nombre Z → A' },
  { value: 'price_asc',  label: 'Precio ↑' },
  { value: 'price_desc', label: 'Precio ↓' },
]

export default function MobileCatalogControls({
  categories, brands, collections, colors, clearHref, currentSort, activeFilters = [],
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const lastScrollY = useRef(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY
      if (currentY < 80) {
        setNavHidden(false)
        lastScrollY.current = currentY
        return
      }
      const diff = currentY - lastScrollY.current
      if (diff > 4) setNavHidden(true)
      else if (diff < -4) setNavHidden(false)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { query, setQuery } = useCatalogSearch()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const activeFilterCount = [
    categories.some(i => i.active),
    brands.some(i => i.active),
    collections.some(i => i.active),
    colors.some(i => i.active),
    !!query.trim(),
  ].filter(Boolean).length

  function changeSort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('sort', value)
    else params.delete('sort')
    router.push(`/catalogo?${params.toString()}`)
  }

  return (
    <>
      {/* ── Sort / filter bar — fixed below navbar (mobile only) ── */}
      <div className={`lg:hidden fixed top-[112px] left-0 right-0 z-30 bg-white border-b border-gray-200 transition-transform duration-300 ease-in-out ${
        navHidden ? '-translate-y-[112px]' : 'translate-y-0'
      }`}>
        {/* Row 1: Sort + Filter buttons */}
        <div className="flex items-center justify-between px-5 h-9">
          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-800">Sort by</span>
            <span className="text-[11px] font-black text-[#364458]">+</span>
            <div className="relative">
              <select
                value={currentSort ?? 'name_asc'}
                onChange={e => changeSort(e.target.value)}
                className="appearance-none bg-transparent text-[11px] font-bold uppercase tracking-wide text-[#364458] pr-4 focus:outline-none cursor-pointer h-5 leading-none"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-[#364458]">▾</span>
            </div>
          </div>

          {/* Filter */}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-gray-800"
          >
            Filter
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#364458] text-white text-[9px] font-black flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="10" y1="18" x2="14" y2="18" />
            </svg>
          </button>
        </div>

        {/* Row 2: Active filter chips (only when filters are applied) */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 px-5 pb-2.5 overflow-x-auto scrollbar-none">
            {activeFilters.map(f => (
              <Link
                key={f.href}
                href={f.href}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 bg-[#364458] text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                {f.label} ×
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-[55] bg-black/40 lg:hidden transition-opacity duration-300 ${
          filterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setFilterOpen(false)}
      />

      {/* ── Filter drawer panel ── */}
      <div
        className={`fixed inset-y-0 right-0 z-[60] w-full max-w-sm bg-white flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${
          filterOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
          <span className="text-sm font-black uppercase tracking-widest">Filter</span>
          <button
            onClick={() => setFilterOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {/* Search */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Buscar</p>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Nombre del producto..."
                className="w-full border-b border-gray-300 pb-1 text-xs focus:outline-none focus:border-[#364458] font-bold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); searchInputRef.current?.focus() }}
                  className="absolute right-0 bottom-1.5 text-gray-400 hover:text-gray-600 text-xs leading-none"
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {categories.length > 0 && (
            <DrawerSection title="Categoría" items={categories} onSelect={() => setFilterOpen(false)} />
          )}
          {brands.length > 0 && (
            <DrawerSection title="Marca" items={brands} onSelect={() => setFilterOpen(false)} />
          )}
          {collections.length > 0 && (
            <DrawerSection title="Colección" items={collections} onSelect={() => setFilterOpen(false)} />
          )}
          {colors.length > 0 && (
            <DrawerSection title="Color" items={colors} onSelect={() => setFilterOpen(false)} />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <Link
            href={clearHref}
            onClick={() => setFilterOpen(false)}
            className="flex-1 py-3.5 border border-gray-300 text-[11px] font-black uppercase tracking-widest text-center text-gray-500 hover:border-gray-400 transition-colors"
          >
            Limpiar
          </Link>
          <button
            onClick={() => setFilterOpen(false)}
            className="flex-1 py-3.5 bg-[#364458] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors"
          >
            Ver resultados
          </button>
        </div>
      </div>
    </>
  )
}

// ── Drawer section with expand/collapse ──────────────────────────────────────

function DrawerSection({
  title, items, onSelect,
}: { title: string; items: FilterItem[]; onSelect: () => void }) {
  const [open, setOpen] = useState(false)
  const active = items.find(i => i.active)

  return (
    <div className="px-5 py-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <span className="text-xs font-black uppercase tracking-widest">{title}</span>
        <div className="flex items-center gap-2">
          {active && (
            <span className="text-[11px] font-bold text-[#364458]">{active.label}</span>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="transition-transform duration-[280ms] ease-in-out"
            style={{ transform: open ? 'rotate(270deg)' : 'rotate(90deg)' }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 280ms ease-in-out',
        }}
      >
        <ul className="overflow-hidden flex flex-col mt-3">
          {items.map(item => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onSelect}
                className={`block py-2 text-sm border-b border-gray-50 last:border-0 ${
                  item.active
                    ? 'font-black text-[#364458]'
                    : 'font-medium text-gray-600 hover:text-[#364458]'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
