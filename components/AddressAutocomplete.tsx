'use client'

import { useState, useEffect, useRef } from 'react'

export interface ParsedAddress {
  calle: string
  colonia: string
  cp: string
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (parsed: ParsedAddress) => void
}

function getComponent(
  components: { longText: string; types: string[] }[],
  ...types: string[]
): string {
  return components.find((c) => types.some((t) => c.types.includes(t)))?.longText ?? ''
}

export default function AddressAutocomplete({ value, onChange, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const [activeIdx, setActiveIdx]     = useState(-1)
  const [error, setError]             = useState('')

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef     = useRef<HTMLUListElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  // Debounce → fetch suggestions
  useEffect(() => {
    setError('')
    if (value.length < 4) {
      setSuggestions([])
      setOpen(false)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/places?input=${encodeURIComponent(value)}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Error al buscar')
          setSuggestions([])
          return
        }

        const items: Suggestion[] = (data.suggestions ?? []).map((s: {
          placePrediction: {
            placeId: string
            text: { text: string }
            structuredFormat?: {
              mainText: { text: string }
              secondaryText?: { text: string }
            }
          }
        }) => ({
          placeId: s.placePrediction.placeId,
          mainText:
            s.placePrediction.structuredFormat?.mainText?.text ??
            s.placePrediction.text.text,
          secondaryText:
            s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
        }))

        setSuggestions(items)
        setOpen(items.length > 0)
      } catch {
        setError('Error de conexión')
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [value])

  // Scroll al item activo
  useEffect(() => {
    if (!listRef.current || activeIdx < 0) return
    ;(listRef.current.children[activeIdx] as HTMLElement | undefined)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  // Cerrar al click fuera
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function pick(s: Suggestion) {
    setOpen(false)
    setSuggestions([])
    onChange(s.mainText)

    try {
      const res  = await fetch(`/api/places?placeId=${s.placeId}`)
      const data = await res.json()
      const comps: { longText: string; types: string[] }[] = data.addressComponents ?? []

      const route        = getComponent(comps, 'route')
      const streetNumber = getComponent(comps, 'street_number')
      const colonia      = getComponent(comps, 'sublocality_level_1', 'sublocality', 'neighborhood')
      const cp           = getComponent(comps, 'postal_code')
      const calle        = [route, streetNumber].filter(Boolean).join(' ') || s.mainText

      onSelect({ calle, colonia, cp })
    } catch {
      onSelect({ calle: s.mainText, colonia: '', cp: '' })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) pick(suggestions[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false); setActiveIdx(-1); inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative">

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          placeholder="Ej. Calle Morelos 210, Matamoros"
          onChange={(e) => { onChange(e.target.value); setActiveIdx(-1) }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full border-b-2 border-gray-300 pb-2 pr-20 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors bg-transparent"
        />
        {loading && (
          <span className="absolute right-0 top-0 text-[9px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
            Buscando…
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1 text-[10px] font-bold text-red-500">{error}</p>
      )}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 shadow-xl max-h-64 overflow-y-auto mt-1"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 ${
                i === activeIdx ? 'bg-[#364458] text-white' : 'hover:bg-gray-50'
              }`}
            >
              <p className={`text-[11px] font-bold ${i === activeIdx ? 'text-white' : 'text-gray-900'}`}>
                {s.mainText}
              </p>
              {s.secondaryText && (
                <p className={`text-[10px] mt-0.5 ${i === activeIdx ? 'text-gray-300' : 'text-gray-400'}`}>
                  {s.secondaryText}
                </p>
              )}
            </li>
          ))}
          <li className="px-3 py-1.5 bg-gray-50 flex justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" alt="Powered by Google" height={14} style={{ height: 14 }} />
          </li>
        </ul>
      )}
    </div>
  )
}
