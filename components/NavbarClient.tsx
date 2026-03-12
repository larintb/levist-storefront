'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CartDrawer from './CartDrawer'

interface Props {
  categories: string[]
  brands: string[]
  collections: string[]
}

type Panel = 'mens' | 'womens' | 'categorias' | null

export default function NavbarClient({ categories, brands, collections }: Props) {
  const [active, setActive] = useState<Panel>(null)
  const [visiblePanel, setVisiblePanel] = useState<Panel>(null)
  const [isExiting, setIsExiting] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // Maneja animación de entrada/salida del panel
  useEffect(() => {
    if (active) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      setIsExiting(false)
      setVisiblePanel(active)
    } else if (visiblePanel) {
      setIsExiting(true)
      exitTimerRef.current = setTimeout(() => {
        setVisiblePanel(null)
        setIsExiting(false)
      }, 200)
    }
    return () => { if (exitTimerRef.current) clearTimeout(exitTimerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Cerrar al click fuera
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActive(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setActive(null); setMobileOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Bloquear scroll en mobile
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function toggle(panel: Panel) {
    setActive(prev => prev === panel ? null : panel)
  }

  function navBtn(panel: Panel, label: string) {
    const isOpen = active === panel
    return (
      <button
        onClick={() => toggle(panel)}
        className={`font-bold text-xs uppercase tracking-wide h-full flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
          isOpen ? 'border-black text-black' : 'border-transparent text-gray-600 hover:text-black'
        }`}
      >
        {label}
        <svg
          className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }

  // Contenido de cada panel
  const panelContent: Record<string, { heading: string; image: string; cols: { title: string; links: { label: string; href: string; bold?: boolean }[] }[] }> = {
    mens: {
      heading: 'Hombre',
      image: '/images/nav-mens.jpg',
      cols: [{
        title: 'Productos',
        links: [
          { label: 'Scrub',    href: "/catalogo?category=Men's&q=scrub" },
          { label: 'Pant',     href: "/catalogo?category=Men's&q=pant"  },
          { label: 'Ver Todo', href: "/catalogo?category=Men's", bold: true },
        ],
      }],
    },
    womens: {
      heading: 'Mujer',
      image: '/images/nav-womens.png',
      cols: [{
        title: 'Productos',
        links: [
          { label: 'Scrub',      href: "/catalogo?category=Women's&q=scrub"      },
          { label: 'Pant',       href: "/catalogo?category=Women's&q=pant"       },
          { label: 'Lab Coats',  href: "/catalogo?category=Lab+Coats+Women%27s"  },
          { label: 'Maternidad', href: "/catalogo?category=Maternity"            },
          { label: 'Ver Todo',   href: "/catalogo?category=Women's", bold: true  },
        ],
      }],
    },
    categorias: {
      heading: 'Catálogo',
      image: '/images/nav-catalogo.jpg',
      cols: [
        {
          title: 'Categorías',
          links: categories.map(c => ({ label: c, href: `/catalogo?category=${encodeURIComponent(c)}` })),
        },
        {
          title: 'Marcas',
          links: brands.slice(0, 8).map(b => ({ label: b, href: `/catalogo?brand=${encodeURIComponent(b)}` })),
        },
        {
          title: 'Colecciones',
          links: collections.slice(0, 8).map(c => ({ label: c, href: `/catalogo?collection=${encodeURIComponent(c)}` })),
        },
      ],
    },
  }

  const panel = visiblePanel ? panelContent[visiblePanel] : null

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-black text-white text-xs font-bold py-2 px-4 flex justify-between items-center">
        <div className="flex-1 text-center tracking-widest uppercase">
          Envío gratis en pedidos de +$750 —{' '}
          <Link href="/catalogo" className="underline">Comprar Ahora</Link>
        </div>
        <div className="hidden md:block text-[10px] uppercase tracking-widest">Mi Cuenta</div>
      </div>

      {/* Header */}
      <header ref={headerRef} className="sticky top-0 bg-white z-50 border-b border-gray-100">

        {/* Barra principal */}
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            onClick={() => setActive(null)}
            className="text-3xl font-black tracking-tighter italic select-none"
          >
            LEVIST
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden lg:flex items-center h-full space-x-8">
            {navBtn('mens', 'Mens')}
            {navBtn('womens', 'Womens')}
            {navBtn('categorias', 'Categorías')}
            <Link
              href="/pedidos"
              onClick={() => setActive(null)}
              className="font-bold text-xs uppercase tracking-wide text-gray-600 hover:text-black transition-colors h-full flex items-center border-b-2 border-transparent hover:border-black"
            >
              Pedidos
            </Link>
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

            <CartDrawer />

            {/* Hamburger — mobile */}
            <button
              className="lg:hidden flex flex-col gap-1.5 cursor-pointer"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menú"
            >
              <span className={`block w-6 h-0.5 bg-black transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-black transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-black transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Panel acordeón — desktop */}
        <div
          className={`hidden lg:grid transition-[grid-template-rows] duration-300 ease-in-out ${
            active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            {panel && (
              <div key={visiblePanel} className={`border-t border-gray-100 bg-white${isExiting ? ' nav-panel-exit' : ''}`}>
                <div className="max-w-7xl mx-auto flex items-stretch h-[260px]">

                  {/* Contenido: heading + columnas */}
                  <div className="flex gap-16 items-start px-6 py-8 flex-1 overflow-hidden">

                    {/* Nombre gigante de sección */}
                    <div className="flex-shrink-0 w-40 nav-anim-heading">
                      <p className="text-5xl font-black italic tracking-tighter leading-none text-black">
                        {panel.heading}
                      </p>
                      <div className="w-8 h-1 bg-yellow-400 mt-3" />
                    </div>

                    {/* Columnas de links */}
                    <div className="flex gap-16">
                      {panel.cols.map((col, ci) => (
                        <div key={col.title} className="flex flex-col gap-1 min-w-[120px]">
                          <p
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 nav-anim-item"
                            style={{ animationDelay: `${ci * 40 + 40}ms` }}
                          >
                            {col.title}
                          </p>
                          {col.links.map((link, li) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setActive(null)}
                              className={`nav-anim-item text-sm transition-colors py-0.5 ${
                                link.bold
                                  ? 'font-black uppercase tracking-widest text-black hover:text-gray-500 mt-2'
                                  : 'font-medium text-gray-700 hover:text-black'
                              }`}
                              style={{ animationDelay: `${ci * 40 + li * 30 + 60}ms` }}
                            >
                              {link.label} {link.bold && '→'}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Imagen editorial — columna derecha, altura completa */}
                  <div className="flex-shrink-0 w-64 relative overflow-hidden nav-anim-image">
                    <Image
                      src={panel.image}
                      alt={panel.heading}
                      fill
                      sizes="256px"
                      className="object-cover object-center scale-110"
                    />
                  </div>
                </div>

                {/* Barra amarilla de cierre */}
                <div className="h-1 bg-yellow-400" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile — overlay fullscreen */}
      <div
        className={`fixed inset-0 z-40 bg-white flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6">
          <Link href="/" onClick={() => setMobileOpen(false)} className="text-3xl font-black tracking-tighter italic">
            LEVIST
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-2xl font-black">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-1">
          {[
            { label: 'Mens',       href: '/catalogo?gender=mens' },
            { label: 'Womens',     href: '/catalogo?gender=womens' },
            { label: 'Catálogo',   href: '/catalogo' },
            { label: 'Pedidos',    href: '/pedidos' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-3xl font-black uppercase italic tracking-tighter py-3 border-b border-gray-100 hover:text-gray-500 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {categories.length > 0 && (
            <div className="mt-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Categorías</p>
              <div className="flex flex-col gap-2">
                {categories.map(c => (
                  <Link
                    key={c}
                    href={`/catalogo?category=${encodeURIComponent(c)}`}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-bold text-gray-600 hover:text-black transition-colors"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="h-1 bg-yellow-400" />
      </div>

      {/* Overlay oscuro mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
