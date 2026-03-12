'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { SortOption } from '@/types/product'

const OPTIONS: { value: SortOption | ''; label: string }[] = [
  { value: 'name_asc',   label: 'Nombre A → Z' },
  { value: 'name_desc',  label: 'Nombre Z → A' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

export default function SortSelector({ current }: { current?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('sort', value)
    else params.delete('sort')
    router.push(`/catalogo?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:block">
        Ordenar
      </span>
      <div className="relative">
        <select
          value={current ?? 'name_asc'}
          onChange={e => onChange(e.target.value)}
          className="appearance-none bg-white border border-gray-200 text-xs font-bold uppercase tracking-wide text-[#364458] pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:border-[#364458] cursor-pointer hover:border-[#364458] transition-colors"
        >
          {OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#364458]"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
