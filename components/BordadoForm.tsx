'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addToCart } from '@/lib/cart'
import type { CartItem } from '@/types/product'

type View = 'start' | 'tipo' | 'lugar' | 'nombre-input' | 'color-hilo' | 'logo-info' | 'summary' | 'success'
type Tipo = 'nombre' | 'logo'

// Precio del bordado en MXN — ajustar según tarifa
const BORDADO_PRICE = 90

const LUGARES = [
  { id: 'Pecho Izquierdo',  label: 'Pecho',  side: 'Izquierdo' },
  { id: 'Pecho Derecho',    label: 'Pecho',  side: 'Derecho'   },
  { id: 'Brazo Izquierdo',  label: 'Brazo',  side: 'Izquierdo' },
  { id: 'Brazo Derecho',    label: 'Brazo',  side: 'Derecho'   },
]

const HILO_COLORS = [
  { name: 'Blanco',      hex: '#F5F5F5', border: true  },
  { name: 'Negro',       hex: '#1A1A1A', border: false },
  { name: 'Azul Marino', hex: '#364458', border: false },
  { name: 'Azul Cielo',  hex: '#8AA7C4', border: false },
  { name: 'Rojo',        hex: '#C0392B', border: false },
  { name: 'Verde',       hex: '#27AE60', border: false },
  { name: 'Gris',        hex: '#95A5A6', border: false },
  { name: 'Dorado',      hex: '#D4AC0D', border: false },
  { name: 'Rosa',        hex: '#E91E8C', border: false },
  { name: 'Morado',      hex: '#8E44AD', border: false },
  { name: 'Naranja',     hex: '#E67E22', border: false },
  { name: 'Café',        hex: '#6D4C41', border: false },
]

function getSteps(tipo: Tipo | null): View[] {
  if (tipo === 'logo') return ['tipo', 'lugar', 'logo-info', 'summary']
  return ['tipo', 'lugar', 'nombre-input', 'color-hilo', 'summary']
}

export default function BordadoForm() {
  const [view, setView]         = useState<View>('start')
  const [visible, setVisible]   = useState(true)
  const [tipo, setTipo]         = useState<Tipo | null>(null)
  const [lugar, setLugar]       = useState<string | null>(null)
  const [nombre, setNombre]     = useState('')
  const [colorHilo, setColorHilo] = useState<string | null>(null)

  function goTo(next: View) {
    setVisible(false)
    setTimeout(() => {
      setView(next)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }, 280)
  }

  function goBack() {
    const map: Partial<Record<View, View>> = {
      tipo:          'start',
      lugar:         'tipo',
      'nombre-input':'lugar',
      'color-hilo':  'nombre-input',
      'logo-info':   'lugar',
      summary:       tipo === 'logo' ? 'logo-info' : 'color-hilo',
    }
    const prev = map[view]
    if (prev) goTo(prev)
  }

  function handleAddToCart() {
    const slug = `${lugar!.replace(/\s+/g, '_').toLowerCase()}_${(nombre || 'logo').replace(/\s+/g, '_').toLowerCase()}`
    const id = `embroidery_${tipo}_${slug}`
    const item: CartItem = {
      product_id:   'bordado',
      product_name: 'Bordado',
      variant_key:  id,
      inventory_id: id,
      color:        tipo === 'logo' ? 'Logo' : colorHilo!,
      size:         lugar!,
      price:        BORDADO_PRICE,
      quantity:     1,
      stock:        999,
      image_url:    null,
      item_type:    'embroidery',
      embroidery: {
        tipo:      tipo!,
        lugar:     lugar!,
        nombre:    tipo === 'nombre' ? nombre    : undefined,
        colorHilo: tipo === 'nombre' ? colorHilo! : undefined,
      },
    }
    addToCart(item)
    window.dispatchEvent(new CustomEvent('cart-added', {
      detail: {
        name:  tipo === 'nombre' ? `Bordado: ${nombre}` : 'Bordado: Logo',
        color: tipo === 'logo'   ? 'Logo' : colorHilo!,
        size:  lugar!,
      },
    }))
    window.dispatchEvent(new Event('cart-updated'))
    goTo('success')
  }

  function resetForm() {
    setTipo(null)
    setLugar(null)
    setNombre('')
    setColorHilo(null)
    goTo('tipo')
  }

  const fmt = (p: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p)

  const steps     = getSteps(tipo)
  const stepIndex = steps.indexOf(view)
  const isCentered = view === 'start' || view === 'success'

  function renderContent() {
    /* ── START ── */
    if (view === 'start') return (
      <div className="flex flex-col items-center text-center gap-8 max-w-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-3">
            Personalización
          </p>
          <h1 className="text-5xl font-black italic tracking-tighter text-[#364458] leading-[1.05]">
            Bordado<br />Personalizado
          </h1>
          <div className="w-12 h-1 bg-[#8AA7C4] mt-4 mx-auto" />
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Añade tu nombre o logo bordado a tu uniforme.<br />
          Personalización de calidad, directo en tu pedido.
        </p>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Precio por bordado
          </p>
          <p className="text-3xl font-black text-[#364458]">{fmt(BORDADO_PRICE)}</p>
        </div>
        <button
          onClick={() => goTo('tipo')}
          className="px-10 py-4 bg-[#364458] text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-[#2F3F55] active:scale-95 transition-all duration-200 cursor-pointer shadow-[0_8px_30px_rgba(54,68,88,0.25)]"
        >
          Empieza tu bordado →
        </button>
      </div>
    )

    /* ── SUCCESS ── */
    if (view === 'success') return (
      <div className="flex flex-col items-center text-center gap-8 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-[#364458]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#364458]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">¡Listo!</p>
          <h2 className="text-4xl font-black italic tracking-tighter text-[#364458]">Bordado agregado</h2>
          <p className="text-sm text-gray-500 mt-3">Tu bordado fue añadido al carrito.</p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={resetForm}
            className="px-8 py-3.5 border-2 border-[#364458] text-[#364458] text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#364458] hover:text-white transition-all duration-200 cursor-pointer"
          >
            + Agregar otro bordado
          </button>
          <Link
            href="/carrito"
            className="px-8 py-3.5 bg-[#364458] text-white text-center text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#2F3F55] transition-colors"
          >
            Ver carrito →
          </Link>
        </div>
      </div>
    )

    /* ── TIPO ── */
    if (view === 'tipo') return (
      <div className="flex flex-col gap-8 w-full">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <h2 className="text-3xl font-black italic tracking-tighter text-[#364458] leading-tight">
            ¿Qué tipo de<br />bordado quieres?
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([
            {
              id: 'nombre' as Tipo,
              label: 'Nombre',
              desc: 'Bordamos el nombre que elijas en el color que prefieras',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ),
            },
            {
              id: 'logo' as Tipo,
              label: 'Logo',
              desc: 'Envíanos tu logo y lo bordamos tal cual en tu uniforme',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setTipo(opt.id); goTo('lugar') }}
              className="flex flex-col items-start gap-3 p-5 border-2 border-gray-100 rounded-2xl hover:border-[#364458] hover:bg-[#364458]/5 transition-all duration-200 cursor-pointer text-left group"
            >
              <span className="text-[#364458] group-hover:scale-110 transition-transform duration-200">
                {opt.icon}
              </span>
              <div>
                <p className="text-sm font-black text-[#364458]">{opt.label}</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )

    /* ── LUGAR ── */
    if (view === 'lugar') return (
      <div className="flex flex-col gap-8 w-full">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <h2 className="text-3xl font-black italic tracking-tighter text-[#364458] leading-tight">
            ¿Dónde va<br />el bordado?
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {LUGARES.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLugar(l.id)
                goTo(tipo === 'logo' ? 'logo-info' : 'nombre-input')
              }}
              className="flex flex-col items-start gap-1.5 p-5 border-2 border-gray-100 rounded-2xl hover:border-[#364458] hover:bg-[#364458]/5 transition-all duration-200 cursor-pointer text-left"
            >
              <p className="text-sm font-black text-[#364458]">{l.label}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{l.side}</p>
            </button>
          ))}
        </div>
      </div>
    )

    /* ── NOMBRE INPUT ── */
    if (view === 'nombre-input') return (
      <div className="flex flex-col gap-8 w-full">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <h2 className="text-3xl font-black italic tracking-tighter text-[#364458] leading-tight">
            ¿Cuál es el nombre<br />que vas a bordar?
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nombre.trim()) goTo('color-hilo') }}
            placeholder="Ej: Dra. García"
            maxLength={40}
            autoFocus
            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base font-bold text-[#364458] placeholder:text-gray-300 focus:outline-none focus:border-[#364458] transition-colors"
          />
          <p className="text-[10px] text-gray-400 text-right">{nombre.length}/40</p>
        </div>
        <button
          onClick={() => goTo('color-hilo')}
          disabled={!nombre.trim()}
          className="px-8 py-4 bg-[#364458] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#2F3F55] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Continuar →
        </button>
      </div>
    )

    /* ── COLOR HILO ── */
    if (view === 'color-hilo') return (
      <div className="flex flex-col gap-8 w-full">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <h2 className="text-3xl font-black italic tracking-tighter text-[#364458] leading-tight">
            Elige el color<br />del hilo
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {HILO_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => { setColorHilo(c.name); goTo('summary') }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-12 h-12 rounded-full transition-all duration-200 group-hover:scale-110 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-[#8AA7C4] ${
                  colorHilo === c.name ? 'ring-2 ring-offset-2 ring-[#364458] scale-110' : ''
                } ${c.border ? 'border border-gray-200' : ''}`}
                style={{ backgroundColor: c.hex }}
              />
              <p className="text-[9px] font-bold text-gray-500 text-center leading-tight">{c.name}</p>
            </button>
          ))}
        </div>
      </div>
    )

    /* ── LOGO INFO ── */
    if (view === 'logo-info') return (
      <div className="flex flex-col gap-8 w-full">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">
            Paso {stepIndex + 1} de {steps.length}
          </p>
          <h2 className="text-3xl font-black italic tracking-tighter text-[#364458] leading-tight">
            Envíanos<br />tu logo
          </h2>
        </div>
        <div className="bg-[#364458]/5 rounded-2xl p-6 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full bg-[#364458]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#364458]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Una vez que completes tu pedido, envía tu logo a nuestro correo junto con tu <strong>número de orden de confirmación</strong>:
          </p>
          <a
            href="mailto:pedidos@levistuniforms.com"
            className="text-sm font-black text-[#364458] underline decoration-[#8AA7C4] underline-offset-4 break-all"
          >
            pedidos@levistuniforms.com
          </a>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Formatos aceptados: PNG, SVG, AI, PDF · Resolución mínima: 300 DPI
          </p>
        </div>
        <button
          onClick={() => goTo('summary')}
          className="px-8 py-4 bg-[#364458] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#2F3F55] transition-colors cursor-pointer"
        >
          Continuar →
        </button>
      </div>
    )

    /* ── SUMMARY ── */
    if (view === 'summary') {
      type Row = { label: string; value: string; swatch?: string }
      const rows: Row[] = tipo === 'logo'
        ? [
            { label: 'Tipo',  value: 'Logo'   },
            { label: 'Lugar', value: lugar!    },
          ]
        : [
            { label: 'Tipo',          value: 'Nombre'   },
            { label: 'Lugar',         value: lugar!     },
            { label: 'Nombre',        value: nombre     },
            {
              label: 'Color del hilo',
              value: colorHilo!,
              swatch: HILO_COLORS.find((c) => c.name === colorHilo)?.hex,
            },
          ]

      return (
        <div className="flex flex-col gap-8 w-full">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8AA7C4] mb-2">
              Confirma tu bordado
            </p>
            <h2 className="text-3xl font-black italic tracking-tighter text-[#364458]">Resumen</h2>
          </div>

          <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between px-5 py-3.5 ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{row.label}</span>
                <div className="flex items-center gap-2">
                  {row.swatch && (
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ backgroundColor: row.swatch }}
                    />
                  )}
                  <span className="text-sm font-bold text-[#364458]">{row.value}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-4 bg-[#364458]/5 border-t border-gray-100">
              <span className="text-xs font-black uppercase tracking-widest text-[#364458]">Precio</span>
              <span className="text-lg font-black text-[#364458]">{fmt(BORDADO_PRICE)}</span>
            </div>
          </div>

          {tipo === 'logo' && (
            <div className="flex items-start gap-3 bg-[#8AA7C4]/10 rounded-xl p-4">
              <svg className="w-4 h-4 text-[#364458] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Recuerda enviar tu logo a <strong>pedidos@levistuniforms.com</strong> con tu número de orden de confirmación.
              </p>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="px-8 py-4 bg-[#364458] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#2F3F55] active:scale-95 transition-all duration-200 cursor-pointer shadow-[0_8px_30px_rgba(54,68,88,0.2)]"
          >
            Agregar al carrito →
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div
        style={{
          transition: 'opacity 0.28s ease, transform 0.28s ease',
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
        }}
        className={
          isCentered
            ? 'min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-16'
            : 'max-w-[480px] mx-auto px-6 py-14 flex flex-col'
        }
      >
        {/* Back button */}
        {!isCentered && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors cursor-pointer mb-10"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Atrás
          </button>
        )}

        {/* Progress bar */}
        {stepIndex !== -1 && (
          <div className="flex gap-1.5 mb-10">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  i <= stepIndex ? 'bg-[#364458]' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  )
}
