'use client'

import { useState, useEffect, useRef } from 'react'

export interface ParsedAddress {
  calle:   string
  colonia: string
  cp:      string
}

interface Props {
  value:    string
  onChange: (value: string) => void
  onSelect: (parsed: ParsedAddress) => void
}

interface DropdownItem {
  mapboxId: string
  label:    string
  sublabel: string
}

// Parsea el feature del retrieve para extraer calle, colonia y CP
function parseRetrieveFeature(feature: Record<string, unknown>): ParsedAddress {
  const props   = (feature.properties ?? {}) as Record<string, unknown>
  const ctx     = (props.context     ?? {}) as Record<string, Record<string, string>>

  const streetName   = ctx.address?.street_name   ?? ''
  const streetNumber = ctx.address?.address_number ?? ''
  const calle  = streetName && streetNumber
    ? `${streetName} ${streetNumber}`
    : streetName || (props.name as string) || ''

  const colonia =
    ctx.neighborhood?.name ??
    ctx.locality?.name     ??
    ctx.district?.name     ??
    ''

  const cp = ctx.postcode?.name ?? ''

  return { calle, colonia, cp }
}

export default function AddressAutocomplete({ value, onChange, onSelect }: Props) {
  const [items,     setItems]     = useState<DropdownItem[]>([])
  const [open,      setOpen]      = useState(false)
  const [fetching,  setFetching]  = useState(false)   // suggest en curso
  const [selecting, setSelecting] = useState(false)   // retrieve en curso
  const [error,     setError]     = useState('')
  const [activeIdx, setActiveIdx] = useState(-1)

  const session      = useRef('')
  const debounce     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  // Generar session token al montar
  useEffect(() => { session.current = crypto.randomUUID() }, [])

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Scroll al item activo con teclado
  useEffect(() => {
    if (!listRef.current || activeIdx < 0) return
    ;(listRef.current.children[activeIdx] as HTMLElement | undefined)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  // Debounce → suggest
  useEffect(() => {
    setError('')
    if (value.length < 4) { setItems([]); setOpen(false); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setFetching(true)
      try {
        const res  = await fetch(`/api/places?input=${encodeURIComponent(value)}&session=${session.current}`)
        const data = await res.json() as { suggestions?: Array<{ mapbox_id: string; name: string; place_formatted: string }>; error?: string }
        if (!res.ok) { setError(data.error ?? 'Error al buscar'); setItems([]); return }
        const list: DropdownItem[] = (data.suggestions ?? []).map((s) => ({
          mapboxId: s.mapbox_id,
          label:    s.name,
          sublabel: s.place_formatted ?? '',
        }))
        setItems(list)
        setOpen(list.length > 0)
      } catch {
        setError('Error de conexión')
        setItems([])
      } finally {
        setFetching(false)
      }
    }, 400)
  }, [value])

  // Seleccionar item → retrieve para obtener colonia + CP completos
  async function pick(item: DropdownItem) {
    setOpen(false)
    setItems([])
    onChange(item.label)
    setSelecting(true)
    try {
      const res  = await fetch(`/api/places?id=${encodeURIComponent(item.mapboxId)}&session=${session.current}`)
      const data = await res.json() as { features?: Array<Record<string, unknown>>; error?: string }
      if (!res.ok || !data.features?.length) {
        // fallback: enviar lo que tenemos sin colonia/cp
        onSelect({ calle: item.label, colonia: '', cp: '' })
        return
      }
      onSelect(parseRetrieveFeature(data.features[0]))
    } catch {
      onSelect({ calle: item.label, colonia: '', cp: '' })
    } finally {
      setSelecting(false)
      // Rotar session token: la sesión termina en el retrieve
      session.current = crypto.randomUUID()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault() } ; return }
    if      (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter')     { e.preventDefault(); if (activeIdx >= 0 && items[activeIdx]) pick(items[activeIdx]) }
    else if (e.key === 'Escape')    { setOpen(false); setActiveIdx(-1); inputRef.current?.blur() }
  }

  const busy = fetching || selecting

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          autoComplete="off"
          placeholder="Ej. Calle Morelos 210"
          onChange={(e) => { onChange(e.target.value); setActiveIdx(-1) }}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full border-b-2 border-gray-300 pb-2 pr-24 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors bg-transparent"
        />
        {busy && (
          <span className="absolute right-0 top-0 text-[9px] font-black uppercase tracking-widest text-gray-400 animate-pulse">
            {selecting ? 'Cargando…' : 'Buscando…'}
          </span>
        )}
      </div>

      {error && <p className="mt-1 text-[10px] font-bold text-red-500">{error}</p>}

      {/* Dropdown */}
      {open && items.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 shadow-xl max-h-64 overflow-y-auto mt-1"
        >
          {items.map((item, i) => (
            <li
              key={item.mapboxId}
              onMouseDown={(e) => { e.preventDefault(); pick(item) }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 ${
                i === activeIdx ? 'bg-[#364458] text-white' : 'hover:bg-gray-50'
              }`}
            >
              <p className={`text-[11px] font-bold ${i === activeIdx ? 'text-white' : 'text-gray-900'}`}>
                {item.label}
              </p>
              {item.sublabel && (
                <p className={`text-[10px] mt-0.5 ${i === activeIdx ? 'text-gray-300' : 'text-gray-400'}`}>
                  {item.sublabel}
                </p>
              )}
            </li>
          ))}
          <li className="px-3 py-1.5 bg-gray-50 flex justify-end">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              © Mapbox © OpenStreetMap
            </span>
          </li>
        </ul>
      )}
    </div>
  )
}
