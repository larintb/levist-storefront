'use client'

import { useState, useEffect } from 'react'

interface DiscountCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  uses_count: number
  active: boolean
  created_at: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const fmtDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DescuentosPage() {
  const [codes, setCodes]       = useState<DiscountCode[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Form state
  const [code, setCode]               = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [validFrom, setValidFrom]     = useState('')
  const [validUntil, setValidUntil]   = useState('')
  const [maxUses, setMaxUses]         = useState('')

  async function loadCodes() {
    setLoading(true)
    const res = await fetch('/api/admin/descuentos')
    const data = await res.json()
    setCodes(data.codes ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCodes() }, [])

  function resetForm() {
    setCode(''); setDiscountType('percentage'); setDiscountValue('')
    setValidFrom(''); setValidUntil(''); setMaxUses('')
    setMsg(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || !discountValue) {
      setMsg({ type: 'err', text: 'Código y valor son requeridos.' })
      return
    }
    setSaving(true)
    setMsg(null)
    const res = await fetch('/api/admin/descuentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code:           code.trim().toUpperCase(),
        discount_type:  discountType,
        discount_value: parseFloat(discountValue),
        valid_from:     validFrom  || undefined,
        valid_until:    validUntil || undefined,
        max_uses:       maxUses ? parseInt(maxUses) : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMsg({ type: 'err', text: data.error ?? 'Error al crear el código' })
    } else {
      setMsg({ type: 'ok', text: `✓ Código ${data.code.code} creado` })
      resetForm()
      setShowForm(false)
      await loadCodes()
    }
    setSaving(false)
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch('/api/admin/descuentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  async function handleDelete(id: string, codeStr: string) {
    if (!confirm(`¿Eliminar el código "${codeStr}"?`)) return
    await fetch('/api/admin/descuentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  const activeCodes = codes.filter(c => c.active).length

  return (
    <div className="px-8 py-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Descuentos</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            {activeCodes} código{activeCodes !== 1 ? 's' : ''} activo{activeCodes !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setMsg(null) }}
          className="px-5 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {showForm ? 'Cancelar' : '+ Nuevo código'}
        </button>
      </div>

      {/* Mensaje global */}
      {msg && !showForm && (
        <p className={`text-xs font-bold mb-6 ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}

      {/* Formulario nuevo código */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 p-6 mb-8 flex flex-col gap-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Nuevo código de descuento
          </p>

          {/* Código y tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Código *
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="VERANO20"
                className="w-full border-b-2 border-gray-200 pb-2 text-sm font-black font-mono focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Tipo de descuento *
              </label>
              <div className="flex gap-2">
                {(['percentage', 'fixed'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDiscountType(t)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest border transition-colors cursor-pointer ${
                      discountType === t ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-black'
                    }`}
                  >
                    {t === 'percentage' ? '% Porcentaje' : '$ Monto fijo'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                {discountType === 'percentage' ? 'Porcentaje (1–100) *' : 'Monto en MXN *'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-sm">{discountType === 'percentage' ? '%' : '$'}</span>
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  min="0.01"
                  max={discountType === 'percentage' ? '100' : undefined}
                  step="0.01"
                  placeholder={discountType === 'percentage' ? '10' : '50'}
                  className="flex-1 border-b-2 border-gray-200 pb-2 text-sm font-black focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Usos máximos <span className="normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                min="1"
                placeholder="Sin límite"
                className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Válido desde <span className="normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={e => setValidFrom(e.target.value)}
                className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Válido hasta <span className="normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {msg && (
            <p className={`text-xs font-bold ${msg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {msg.text}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              {saving ? 'Guardando…' : 'Crear código'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-6 py-3 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-black hover:text-black transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de códigos */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest">
            Códigos ({codes.length})
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-xs text-gray-400">Cargando…</div>
        ) : codes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sin códigos todavía</p>
            <p className="text-xs text-gray-300 mt-1">Crea tu primer código con el botón de arriba.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {codes.map(c => {
              const now = new Date()
              const expired = c.valid_until ? new Date(c.valid_until) < now : false
              const notStarted = c.valid_from ? new Date(c.valid_from) > now : false
              const exhausted = c.max_uses !== null && c.uses_count >= c.max_uses

              return (
                <div key={c.id} className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${!c.active ? 'opacity-50' : ''}`}>

                  {/* Código + badge */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono font-black text-base tracking-wider">{c.code}</span>
                    {/* Estado visual */}
                    {!c.active && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-500">Inactivo</span>
                    )}
                    {c.active && expired && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-100 text-red-600">Expirado</span>
                    )}
                    {c.active && notStarted && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-yellow-100 text-yellow-700">Pendiente</span>
                    )}
                    {c.active && !expired && !notStarted && !exhausted && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-700">Activo</span>
                    )}
                    {exhausted && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-orange-100 text-orange-700">Agotado</span>
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span className="text-black font-black">
                      {c.discount_type === 'percentage'
                        ? `${c.discount_value}% off`
                        : `${fmt(c.discount_value)} off`}
                    </span>
                    <span>
                      Usos: {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ''}
                    </span>
                    {c.valid_from && <span>Desde: {fmtDate(c.valid_from)}</span>}
                    {c.valid_until && <span>Hasta: {fmtDate(c.valid_until)}</span>}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(c.id, c.active)}
                      className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors cursor-pointer"
                    >
                      {c.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
