'use client'

import { useState, useEffect, useRef } from 'react'

interface NominatimResult {
  place_id: number
  display_name: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
}

export default function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: `${query}, Matamoros, Tamaulipas`,
          countrycodes: 'mx',
          format: 'json',
          limit: '6',
          // bounding box around Matamoros, Tamaulipas
          viewbox: '-97.7,25.7,-97.3,26.1',
          bounded: '1',
        })
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        if (data.length > 0) setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 450)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectResult(r: NominatimResult) {
    setQuery(r.display_name)
    onChange(r.display_name)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Calle, número, colonia…"
          className="w-full border-b-2 border-gray-300 pb-2 pr-16 text-sm font-bold focus:outline-none focus:border-black transition-colors"
        />
        {loading && (
          <span className="absolute right-0 top-0 text-[9px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
            Buscando…
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto mt-1">
          {results.map((r) => (
            <li
              key={r.place_id}
              onMouseDown={() => selectResult(r)}
              className="px-4 py-3 text-[11px] font-medium cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 leading-snug"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
