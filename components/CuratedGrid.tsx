import ProductCard from './ProductCard'
import type { CuratedItem } from '@/lib/curations'

interface Props {
  title: string
  subtitle?: string
  items: CuratedItem[]
}

export default function CuratedGrid({ title, subtitle, items }: Props) {
  if (!items.length) return null

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4]">
            ⚡ Búsqueda especial
          </span>
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#364458]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
            {subtitle}
          </p>
        )}
      </div>

      {/*
        Grid: 2-col on mobile → pairs appear side-by-side naturally.
        4-col on desktop → groups of 4 [hombre_scrub | hombre_pant | mujer_scrub | mujer_pant] per row.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10">
        {items.map(({ product, role, fitLabel }, idx) => (
          <div key={`${product.product_id}-${role}-${idx}`} className="flex flex-col">
            {fitLabel ? (
              /* "Completar Fit" label above pant card */
              <div className="mb-2 flex items-center gap-1.5">
                <div className="h-px flex-1 bg-[#8AA7C4]/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#8AA7C4] whitespace-nowrap">
                  ⚡ {fitLabel}
                </span>
                <div className="h-px flex-1 bg-[#8AA7C4]/40" />
              </div>
            ) : (
              /* Spacer to keep grid alignment consistent */
              <div className="mb-2 h-[18px]" />
            )}
            <ProductCard product={product} activeColor="white" />
          </div>
        ))}
      </div>

      {/* Bottom divider */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 text-center">
          Fin de la búsqueda curada
        </p>
      </div>
    </div>
  )
}
