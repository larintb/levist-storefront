import Link from 'next/link'
import CartDrawer from './CartDrawer'
import { getCategories, getBrands, getCollections } from '@/lib/catalog'

export default async function Navbar() {
  const [categories, brands, collections] = await Promise.all([
    getCategories(),
    getBrands(),
    getCollections(),
  ])

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-black text-white text-xs font-bold py-2 px-4 flex justify-between items-center">
        <div className="flex-1 text-center tracking-widest uppercase">
          Envío gratis en pedidos de +$750 —{' '}
          <Link href="/catalogo" className="underline">
            Comprar Ahora
          </Link>
        </div>
        <div className="hidden md:block text-[10px] uppercase tracking-widest">Mi Cuenta</div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 bg-white z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-3xl font-black tracking-tighter italic select-none">
            LEVIST
          </Link>

          {/* Nav */}
          <nav className="hidden lg:flex items-center h-full space-x-8">

            {/* Categorías mega menu */}
            {categories.length > 0 && (
              <div className="nav-item relative flex items-center h-full">
                <Link
                  href="/catalogo"
                  className="font-bold text-xs uppercase tracking-wide flex items-center gap-1 h-full"
                >
                  Categorías
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="mega-menu p-10">
                  <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
                    <div>
                      <h4 className="font-black text-xs uppercase mb-4 text-gray-400 tracking-widest">
                        Por Categoría
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {categories.map((cat) => (
                          <li key={cat}>
                            <Link
                              href={`/catalogo?category=${encodeURIComponent(cat)}`}
                              className="hover:underline"
                            >
                              {cat}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {brands.length > 0 && (
                      <div>
                        <h4 className="font-black text-xs uppercase mb-4 text-gray-400 tracking-widest">
                          Por Marca
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {brands.slice(0, 8).map((brand) => (
                            <li key={brand}>
                              <Link
                                href={`/catalogo?brand=${encodeURIComponent(brand)}`}
                                className="hover:underline"
                              >
                                {brand}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {collections.length > 0 && (
                      <div>
                        <h4 className="font-black text-xs uppercase mb-4 text-gray-400 tracking-widest">
                          Colecciones
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {collections.slice(0, 8).map((col) => (
                            <li key={col}>
                              <Link
                                href={`/catalogo?collection=${encodeURIComponent(col)}`}
                                className="hover:underline"
                              >
                                {col}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="nav-item relative flex items-center h-full">
              <Link href="/catalogo" className="font-bold text-xs uppercase tracking-wide h-full flex items-center">
                Catálogo
              </Link>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            <form action="/catalogo" method="GET" className="hidden md:flex items-center border-b border-gray-300 pb-1 gap-2">
              <input
                type="text"
                name="q"
                placeholder="BUSCAR"
                className="text-xs focus:outline-none w-24 font-bold uppercase tracking-widest placeholder:text-gray-400"
              />
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>

            <svg className="w-5 h-5 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>

            <CartDrawer />
          </div>
        </div>
      </header>
    </>
  )
}
