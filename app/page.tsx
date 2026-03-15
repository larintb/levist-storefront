import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedProducts, getCategories, getColorSwatches } from '@/lib/catalog'
import ProductCard from '@/components/ProductCard'
import { colorToHex } from '@/lib/colorToHex'

export const metadata: Metadata = {
  title: 'LEVIST Uniformes | Scrubs y Uniformes Médicos Personalizados',
  description: 'Tienda oficial de LEVIST Uniformes. Scrubs, pijamas clínicas y batas con bordado personalizado para profesionales de la salud.',
  openGraph: {
    title: 'LEVIST Uniformes – Calidad y Estilo para Profesionales',
    description: 'Equípate con los mejores scrubs y uniformes médicos. Diseñados para el confort y la durabilidad en el hospital.',
    type: 'website',
    images: [
      {
        url: '/images/logo.jpg',
        alt: 'LEVIST Uniformes Médicos',
      },
    ],
  },
}

export const revalidate = 300

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ColorsSkeleton() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-8 w-32 bg-gray-100 rounded mb-8 animate-pulse" />
        <div className="flex space-x-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[160px] flex-shrink-0">
              <div className="h-[220px] bg-gray-100 animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoriesSkeleton() {
  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex gap-3 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </section>
  )
}

function FeaturedSkeleton() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-8 w-56 bg-gray-100 rounded mb-10 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="bg-gray-100 aspect-[3/4] w-full animate-pulse mb-3" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Async sections ───────────────────────────────────────────────────────────

const FEATURED_COLORS = ['Navy', 'White', 'Red', 'Black', 'Caribbean', 'Khaki', 'Royal']

async function ColorsSection() {
  const swatches = await getColorSwatches()
  if (!swatches.length) return null

  // Match catalog swatches to featured colors (case-insensitive), preserve order
  const swatchMap = new Map(swatches.map(s => [s.color.toLowerCase().trim(), s]))
  const featured = FEATURED_COLORS
    .map(name => swatchMap.get(name.toLowerCase()) ?? { color: name, image_url: null, in_stock: false })

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shop by</p>
            <h2 className="text-3xl font-black">Color</h2>
          </div>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-6 custom-scrollbar">
          {featured.map(({ color, image_url, in_stock }) => (
            <Link
              key={color}
              href={`/catalogo?color=${encodeURIComponent(color)}`}
              className="min-w-[160px] group cursor-pointer flex-shrink-0"
            >
              <div className="relative h-[220px] overflow-hidden border border-gray-100">
                {image_url ? (
                  <Image
                    src={image_url}
                    alt={color}
                    fill
                    sizes="160px"
                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!in_stock ? 'grayscale opacity-50' : ''}`}
                  />
                ) : (
                  <div
                    className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${!in_stock ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: colorToHex(color) }}
                  />
                )}
                {!in_stock && (
                  <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                    <span className="bg-black/60 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1">
                      No disponible
                    </span>
                  </div>
                )}
              </div>
              <p className={`mt-2 text-xs font-bold uppercase tracking-widest ${!in_stock ? 'text-gray-400' : ''}`}>{color}</p>
            </Link>
          ))}

          {/* See All */}
          <Link
            href="/catalogo"
            className="min-w-[160px] group cursor-pointer flex-shrink-0"
          >
            <div className="relative h-[220px] overflow-hidden border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#364458] flex items-center justify-center group-hover:bg-[#364458] transition-colors duration-300">
                <svg className="w-4 h-4 text-[#364458] group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-[#364458]">Ver Todos</p>
            </div>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-0">_</p>
          </Link>
        </div>
      </div>
    </section>
  )
}

async function CategoriesSection() {
  const categories = await getCategories()
  if (!categories.length) return null
  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
          Shop by Category
        </p>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/catalogo?category=${encodeURIComponent(cat)}`}
              className="px-5 py-2.5 border border-gray-900 text-xs font-black uppercase tracking-widest hover:bg-[#364458] hover:text-white transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

async function FeaturedProducts() {
  const featured = await getFeaturedProducts(8)
  if (!featured.length) return null
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black italic tracking-tighter">Best Selling Scrubs</h2>
          <Link href="/catalogo" className="text-sm font-bold underline">Ver Todo</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {featured.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Hero — sin datos, aparece instantáneo */}
      <section className="relative h-[85vh] flex items-center bg-[#2F3F55]">
        <Image
          src="/images/hero.png"
          alt="Levist Uniformes"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/10" />
        <div className="relative max-w-7xl mx-auto px-10 w-full flex justify-end">
            <div className="bg-white/10 backdrop-blur-sm p-12 max-w-lg shadow-2xl">
            <span className="bg-[#8AA7C4] text-[10px] font-black px-2 py-1 uppercase tracking-widest text-black">
              Colección Disponible
            </span>
            <h1 className="text-5xl font-black mt-4 leading-tight tracking-tighter text-white">
              Calidad que se siente en cada turno.
            </h1>
            <p className="text-lg mt-4 text-gray-100">
              Uniformes médicos diseñados para profesionales que exigen lo mejor.
            </p>
            <Link
              href="/catalogo"
              className="inline-block mt-8 bg-white text-black px-10 py-4 font-bold hover:bg-gray-200 transition-all uppercase tracking-tighter"
            >
              Comprar Ahora
            </Link>
            </div>
        </div>
      </section>

      {/* Colores — caché, carga rápido */}
      <Suspense fallback={<ColorsSkeleton />}>
        <ColorsSection />
      </Suspense>

      {/* Categorías — caché, carga rápido */}
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>

      {/* Productos destacados — más pesado, carga en paralelo */}
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedProducts />
      </Suspense>
    </>
  )
}
