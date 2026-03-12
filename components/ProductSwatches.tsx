'use client'

import { useState } from 'react'
import type { ProductVariant } from '@/types/product'
import { colorToHex } from '@/lib/colorToHex'

interface Props {
  variants: ProductVariant[]
  productId: string
  productName: string
  onSwatchHover?: (imageUrl: string | null, isOos: boolean) => void
}

export default function ProductSwatches({ variants, productId, productName, onSwatchHover }: Props) {
  const [notifyColor, setNotifyColor] = useState<string | null>(null)
  const [email, setEmail]             = useState('')
  const [status, setStatus]           = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  if (variants.length <= 1) return null

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    if (!notifyColor) return
    setStatus('loading')
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, product_id: productId, product_name: productName, color: notifyColor }),
    })
    setStatus(res.ok ? 'ok' : 'err')
  }

  return (
    <div className="mt-2">
      {/* Swatches — in-stock navigate, OOS open notify form */}
      <div className="flex flex-wrap gap-1.5">
        {variants.map((v) => {
          const oos = !v.in_stock
          const isActive = notifyColor === v.color
          return (
            <button
              key={v.variant_key}
              title={v.color + (oos ? ' — Agotado' : '')}
              onMouseEnter={() => onSwatchHover?.(v.image_url ?? null, oos)}
              onMouseLeave={() => onSwatchHover?.(null, false)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (oos) {
                  setNotifyColor(isActive ? null : v.color)
                  setStatus('idle')
                  setEmail('')
                }
                // in-stock: do nothing — parent Link handles navigation
              }}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                oos
                  ? isActive
                    ? 'border-black ring-1 ring-black ring-offset-1 cursor-pointer'
                    : 'border-gray-200 cursor-pointer hover:border-gray-400'
                  : 'border-transparent cursor-default hover:border-gray-300'
              }`}
              style={{
                backgroundColor: colorToHex(v.color),
                opacity: oos ? 0.55 : 1,
              }}
            />
          )
        })}
      </div>

      {/* Formulario de notificación inline */}
      {notifyColor && (
        <div
          className="mt-2 bg-gray-50 border border-gray-200 p-3"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          {status === 'ok' ? (
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
              ✓ Te avisamos cuando haya {notifyColor}
            </p>
          ) : (
            <form onSubmit={handleNotify} className="flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Avísame — {notifyColor}
              </p>
              <div className="flex gap-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="flex-1 border-b border-gray-300 pb-1 text-[11px] font-bold bg-transparent focus:outline-none focus:border-black transition-colors min-w-0"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest flex-shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {status === 'loading' ? '…' : '→'}
                </button>
              </div>
              {status === 'err' && (
                <p className="text-[10px] text-red-500 font-bold">Error, intenta de nuevo.</p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  )
}
