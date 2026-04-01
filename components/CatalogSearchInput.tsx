'use client'

import { useRef } from 'react'
import { useCatalogSearch } from '@/contexts/CatalogSearchContext'

export default function CatalogSearchInput() {
  const { query, setQuery } = useCatalogSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Buscar</p>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nombre del producto..."
          className="w-full border-b border-gray-300 pb-1 text-xs focus:outline-none focus:border-[#364458] font-bold uppercase tracking-wide placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="absolute right-0 bottom-1.5 text-gray-400 hover:text-gray-600 text-xs leading-none"
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
