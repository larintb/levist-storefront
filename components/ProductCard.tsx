import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types/product'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const priceLabel =
    product.min_price === product.max_price
      ? fmt(product.min_price)
      : `${fmt(product.min_price)} – ${fmt(product.max_price)}`

  return (
    <Link href={`/catalogo/${product.product_id}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-gray-100 mb-4">
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {product.variants.length > 1 && (
          <span className="absolute bottom-3 left-3 bg-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">
            {product.variants.length} Colores
          </span>
        )}
      </div>

      {/* Info */}
      <h3 className="font-bold text-xs uppercase tracking-tight line-clamp-2 group-hover:underline">
        {product.product_name}
      </h3>
      {product.brand && (
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{product.brand}</p>
      )}
      <p className="text-sm font-bold text-gray-600 mt-1">{priceLabel}</p>

      {/* Color swatches */}
      {product.variants.length > 1 && (
        <div className="flex space-x-1 mt-2">
          {product.variants.slice(0, 5).map((v) => (
            <span
              key={v.variant_key}
              title={v.color}
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: colorToHex(v.color) }}
            />
          ))}
        </div>
      )}
    </Link>
  )
}

export function colorToHex(color: string): string {
  const map: Record<string, string> = {
    blanco: '#FFFFFF', white: '#FFFFFF',
    negro: '#111111', black: '#111111',
    azul: '#1D4ED8', blue: '#1D4ED8', royal: '#002B5B', navy: '#1E3A5F', marino: '#1E3A5F',
    rojo: '#DC2626', red: '#DC2626', wine: '#7D1D3F', burgundy: '#6D1A36',
    verde: '#15803D', green: '#15803D', teal: '#0D9488', turquesa: '#0D9488', jade: '#00A36C', hunter: '#2D5A27', olive: '#6B7C45',
    gris: '#9CA3AF', gray: '#9CA3AF', grey: '#9CA3AF', graphite: '#374151', charcoal: '#374151', pewter: '#9CA3AF', silver: '#C0C0C0',
    rosa: '#EC4899', pink: '#EC4899', coral: '#FF6B6B', berry: '#8B1A4A',
    morado: '#7C3AED', purple: '#7C3AED', plum: '#673264', indigo: '#4338CA',
    amarillo: '#EAB308', yellow: '#EAB308',
    naranja: '#F97316', orange: '#F97316',
    cafe: '#92400E', brown: '#92400E', khaki: '#C3AD83', beige: '#D4B896',
    ceil: '#92A8C8', ciel: '#92A8C8', caribbean: '#0097A7',
  }
  return map[color.toLowerCase().trim()] ?? '#E5E7EB'
}
