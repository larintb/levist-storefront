'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  currentStatus: string
  customerEmail: string | null
  customerName: string
  deliveryMethod: 'pickup' | 'delivery'
}

export default function OrderActions({ orderId, currentStatus, customerEmail, customerName, deliveryMethod }: Props) {
  const router = useRouter()
  const [panel, setPanel]           = useState<'confirm' | 'cancel' | null>(null)
  const [customMessage, setMessage] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const nextStatus   = deliveryMethod === 'delivery' ? 'shipped' : 'ready'
  const actionLabel  = deliveryMethod === 'delivery' ? 'Marcar como Enviado' : 'Marcar como Listo'
  const emailSubject = deliveryMethod === 'delivery' ? '📦 Tu pedido está en camino' : '🎉 Tu pedido está listo para recoger'

  async function submit(status: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          custom_message: customMessage.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al actualizar')
        return
      }
      setPanel(null)
      setMessage('')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus !== 'paid' && currentStatus !== 'ready' && currentStatus !== 'shipped') {
    return null
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Botones principales */}
      {panel === null && (
        <div className="flex flex-wrap gap-2">
          {(currentStatus === 'paid') && (
            <button
              onClick={() => setPanel('confirm')}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black hover:bg-yellow-300 transition-colors cursor-pointer"
            >
              {actionLabel} →
            </button>
          )}
          {(currentStatus === 'ready' || currentStatus === 'shipped') && (
            <button
              onClick={() => submit('picked_up')}
              disabled={loading}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Procesando…' : '✓ Confirmar Entrega'}
            </button>
          )}
          {(currentStatus === 'paid' || currentStatus === 'ready') && (
            <button
              onClick={() => setPanel('cancel')}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-red-200 text-red-500 hover:border-red-500 transition-colors cursor-pointer"
            >
              Cancelar pedido
            </button>
          )}
        </div>
      )}

      {/* Panel: Confirmar + mensaje personalizado */}
      {panel === 'confirm' && (
        <div className="border border-gray-200 bg-gray-50 p-5 flex flex-col gap-4">

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-1">
                {emailSubject}
              </p>
              {customerEmail ? (
                <p className="text-xs text-gray-500">
                  Se enviará un email automático a <strong>{customerEmail}</strong>
                </p>
              ) : (
                <p className="text-xs text-red-500 font-bold">
                  Este cliente no tiene email — no se enviará notificación.
                </p>
              )}
            </div>
            <button
              onClick={() => { setPanel(null); setMessage('') }}
              className="text-gray-400 hover:text-black text-lg leading-none flex-shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Mensaje opcional */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Mensaje personalizado para {customerName.split(' ')[0]} <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                deliveryMethod === 'delivery'
                  ? 'Ej. Tu pedido salió a las 3pm, llegará aproximadamente en 2 horas.'
                  : 'Ej. Puedes pasar de lunes a viernes de 9am a 6pm. Pregunta por Karen.'
              }
              rows={3}
              className="w-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:border-black transition-colors resize-none"
            />
            <p className="text-[9px] text-gray-400 mt-1">
              Si lo dejas vacío, el email incluye solo la información estándar del pedido.
            </p>
          </div>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => submit(nextStatus)}
              disabled={loading}
              className="px-5 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enviando…' : `Confirmar y enviar email`}
            </button>
            <button
              onClick={() => { setPanel(null); setMessage('') }}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-black hover:text-black transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Panel: Confirmar cancelación */}
      {panel === 'cancel' && (
        <div className="border border-red-200 bg-red-50 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-1">
                Cancelar pedido #{orderId.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-red-500">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <button onClick={() => setPanel(null)} className="text-red-300 hover:text-red-700 text-lg leading-none cursor-pointer">✕</button>
          </div>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => submit('cancelled')}
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Cancelando…' : 'Sí, cancelar pedido'}
            </button>
            <button
              onClick={() => setPanel(null)}
              className="px-5 py-2.5 border border-red-200 text-[10px] font-black uppercase tracking-widest text-red-400 hover:border-red-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              No, regresar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
