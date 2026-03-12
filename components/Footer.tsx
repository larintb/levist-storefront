import Link from 'next/link'
import { getCategories, getBrands } from '@/lib/catalog'

export default async function Footer() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()])

  return (
    <footer className="bg-[#2F3F55] text-white pt-20 pb-10 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 border-b border-gray-800 pb-16 mb-10">

        {/* Categorías desde DB */}
        <div>
          <h4 className="font-black text-xs uppercase mb-6 tracking-widest">Categorías</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat}>
                <Link
                  href={`/catalogo?category=${encodeURIComponent(cat)}`}
                  className="hover:text-white transition-colors"
                >
                  {cat}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/catalogo" className="hover:text-white transition-colors">
                Ver Todo
              </Link>
            </li>
          </ul>
        </div>

        {/* Marcas desde DB */}
        <div>
          <h4 className="font-black text-xs uppercase mb-6 tracking-widest">Marcas</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            {brands.slice(0, 6).map((brand) => (
              <li key={brand}>
                <Link
                  href={`/catalogo?brand=${encodeURIComponent(brand)}`}
                  className="hover:text-white transition-colors"
                >
                  {brand}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Soporte */}
        <div>
          <h4 className="font-black text-xs uppercase mb-6 tracking-widest">Soporte</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li><Link href="/carrito" className="hover:text-white transition-colors">Mi Bolsa</Link></li>
            <li><Link href="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
          </ul>
        </div>

        {/* Brand */}
        <div>
          <h4 className="font-black text-xs uppercase mb-6 tracking-widest italic">LEVIST</h4>
          <p className="text-[10px] text-gray-400 mb-6 leading-relaxed">
            Uniformes médicos de calidad para profesionales de la salud.
          </p>
          <div className="flex space-x-3">
            <a href="https://www.instagram.com/levistuniforms/" target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@levist.uniformes" target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.67a8.19 8.19 0 0 0 4.78 1.52V6.7a4.85 4.85 0 0 1-1.01-.01z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/uniformesmedicoslevist" target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-[10px] text-gray-500 flex flex-col sm:flex-row justify-between gap-2 uppercase font-bold tracking-widest">
        <p>© {new Date().getFullYear()} LEVIST Uniformes. All Rights Reserved.</p>
        <div className="flex space-x-6">
          <span className="cursor-pointer hover:text-gray-300 transition-colors">Privacidad</span>
          <span className="cursor-pointer hover:text-gray-300 transition-colors">Términos</span>
        </div>
      </div>
    </footer>
  )
}
