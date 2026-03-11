import type { Metadata } from 'next'
import Link from 'next/link'
import { getCatalogProducts, getCategories, getColors } from '@/lib/catalog'
import ProductCard from '@/components/ProductCard'
import { colorToHex } from '@/components/ProductCard'

export const metadata: Metadata = {
  title: 'LEVIST Uniformes – Uniformes Médicos de Calidad',
  description: 'Tienda oficial de LEVIST Uniformes. Scrubs, pijamas clínicas y más para profesionales de la salud.',
  openGraph: {
    title: 'LEVIST Uniformes',
    description: 'Uniformes médicos de calidad para profesionales de la salud.',
    type: 'website',
  },
}

export const revalidate = 300

export default async function HomePage() {
  const [allProducts, categories, colors] = await Promise.all([
    getCatalogProducts(),
    getCategories(),
    getColors(),
  ])

  const featured = allProducts.slice(0, 8)

  return (
    <>
      {/* Hero */}
      <section className="relative h-[85vh] flex items-center bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-10 w-full flex justify-end">
          <div className="bg-white/95 p-12 max-w-lg shadow-2xl">
            <span className="bg-yellow-400 text-[10px] font-black px-2 py-1 uppercase tracking-widest">
              Colección Disponible
            </span>
            <h1 className="text-5xl font-black mt-4 leading-tight tracking-tighter">
              Calidad que se siente en cada turno.
            </h1>
            <p className="text-lg mt-4 text-gray-700">
              Uniformes médicos diseñados para profesionales que exigen lo mejor.
            </p>
            <Link
              href="/catalogo"
              className="inline-block mt-8 bg-black text-white px-10 py-4 font-bold hover:bg-gray-800 transition-all uppercase tracking-tighter"
            >
              Comprar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Color — desde la DB */}
      {colors.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shop by</p>
                <h2 className="text-3xl font-black">Color</h2>
              </div>
              <Link href="/catalogo" className="text-sm font-bold underline flex items-center gap-1">
                Ver Todos
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-6 custom-scrollbar">
              {colors.map((color) => (
                <Link
                  key={color}
                  href={`/catalogo?color=${encodeURIComponent(color)}`}
                  className="min-w-[160px] group cursor-pointer flex-shrink-0"
                >
                  <div
                    className="h-[220px] transition-transform group-hover:scale-[1.02] border border-gray-200"
                    style={{ backgroundColor: colorToHex(color) }}
                  />
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest">{color}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop by Category — desde la DB */}
      {categories.length > 0 && (
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
                  className="px-5 py-2.5 border border-gray-900 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers — desde la DB */}
      {featured.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic tracking-tighter">Best Selling Scrubs</h2>
              <Link href="/catalogo" className="text-sm font-bold underline">
                Ver Todo
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {featured.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
