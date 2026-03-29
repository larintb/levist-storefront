'use client'

import { useState, useCallback } from 'react'
import AddressAutocomplete, { type ParsedAddress } from '@/components/AddressAutocomplete'

export interface DeliveryAddress {
  calle:       string
  colonia:     string
  cp:          string
  referencias: string
}

interface Props {
  value:    DeliveryAddress
  onChange: (v: DeliveryAddress) => void
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function DeliveryAddressForm({ value, onChange }: Props) {
  const [confirmed,          setConfirmed]          = useState(false)
  // true sólo cuando la colonia vino del autocomplete — si es false, siempre muestra input
  const [coloniaAutoFilled,  setColoniaAutoFilled]  = useState(false)

  const set = useCallback(
    (patch: Partial<DeliveryAddress>) => onChange({ ...value, ...patch }),
    [value, onChange]
  )

  function handleSelect(parsed: ParsedAddress) {
    onChange({ ...value, calle: parsed.calle, colonia: parsed.colonia, cp: parsed.cp })
    setConfirmed(true)
    setColoniaAutoFilled(!!parsed.colonia)   // bloquear solo si Mapbox trajo colonia
  }

  function handleReset() {
    onChange({ calle: '', colonia: '', cp: '', referencias: value.referencias })
    setConfirmed(false)
    setColoniaAutoFilled(false)
  }

  const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2'
  const fieldCls = 'w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors bg-transparent'

  return (
    <div className="flex flex-col gap-5">

      {/* 1. Dirección — autocomplete */}
      <div>
        <label className={labelCls}>Dirección *</label>
        {confirmed ? (
          <div className="flex items-start justify-between border-b-2 border-[#364458] pb-2 gap-4">
            <div>
              <p className="text-sm font-bold">{value.calle}</p>
              {value.colonia && (
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Col. {value.colonia}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors flex-shrink-0 mt-0.5"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <AddressAutocomplete
              value={value.calle}
              onChange={(v) => set({ calle: v })}
              onSelect={handleSelect}
            />
            <p className="mt-1.5 text-[10px] text-gray-400">
              Escribe tu calle y elige de la lista — colonia y CP se llenan solos
            </p>
          </>
        )}
      </div>

      {/* 2 y 3. Colonia + CP — solo visibles tras confirmar */}
      {confirmed && (
        <>
          {/* Colonia */}
          <div>
            <label className={labelCls}>Colonia *</label>
            {coloniaAutoFilled ? (
              /* Mapbox la trajo — mostrar estático con checkmark */
              <div className="flex items-center gap-2 border-b-2 border-gray-200 pb-2">
                <span className="text-sm font-bold">{value.colonia}</span>
                <CheckIcon />
              </div>
            ) : (
              /* No vino del autocomplete — siempre editable hasta enviar */
              <input
                type="text"
                value={value.colonia}
                onChange={(e) => set({ colonia: e.target.value })}
                placeholder="Ej. Centro"
                autoFocus
                className={fieldCls}
              />
            )}
          </div>

          {/* CP */}
          <div>
            <label className={labelCls}>Código Postal *</label>
            {value.cp ? (
              <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-2">
                <span className="text-sm font-bold tabular-nums">{value.cp}</span>
                <CheckIcon />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">México</span>
              </div>
            ) : (
              <input
                type="text"
                value={value.cp}
                onChange={(e) => set({ cp: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                placeholder="Ej. 87300"
                inputMode="numeric"
                className={fieldCls}
              />
            )}
          </div>

          {/* Notas */}
          <div>
            <label className={labelCls}>
              Notas de entrega
              <span className="normal-case font-normal ml-1">(entre calles, color de fachada, etc.)</span>
            </label>
            <textarea
              value={value.referencias}
              onChange={(e) => set({ referencias: e.target.value })}
              placeholder="Ej. Entre Calle 6 y Calle 7, casa color beige con portón negro"
              rows={3}
              className="w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors resize-none bg-transparent"
            />
          </div>
        </>
      )}
    </div>
  )
}

/** Convierte el objeto en una sola cadena para guardar en la BD */
export function formatAddress(a: DeliveryAddress): string {
  const parts = [a.calle, `Col. ${a.colonia}`, `CP ${a.cp}`, 'México']
  if (a.referencias.trim()) parts.push(`Notas: ${a.referencias.trim()}`)
  return parts.join(', ')
}
