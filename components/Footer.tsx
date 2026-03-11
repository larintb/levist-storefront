import Link from 'next/link'
import { getCategories, getBrands } from '@/lib/catalog'

export default async function Footer() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()])

  return (
    <footer className="bg-black text-white pt-20 pb-10 mt-20">
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
          <div className="flex space-x-4 text-lg text-gray-400">
            <span className="cursor-pointer hover:text-white transition-colors text-sm font-bold">IG</span>
            <span className="cursor-pointer hover:text-white transition-colors text-sm font-bold">TK</span>
            <span className="cursor-pointer hover:text-white transition-colors text-sm font-bold">FB</span>
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
