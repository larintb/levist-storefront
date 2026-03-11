'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  currentStatus: string
  secret?: string
}

export default function OrderActions({ orderId, currentStatus, secret }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function updateStatus(newStatus: string) {
    setLoading(newStatus)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}${secret ? `?secret=${secret}` : ''}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al actualizar')
      } else {
        router.refresh()
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {currentStatus === 'paid' && (
        <button
          onClick={() => updateStatus('ready')}
          disabled={!!loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading === 'ready' ? 'Procesando...' : '✓ Marcar como Listo'}
        </button>
      )}

      {currentStatus === 'ready' && (
        <button
          onClick={() => updateStatus('picked_up')}
          disabled={!!loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading === 'picked_up' ? 'Procesando...' : '✓ Confirmar Entrega'}
        </button>
      )}

      {(currentStatus === 'paid' || currentStatus === 'ready') && (
        <button
          onClick={() => {
            if (confirm('¿Cancelar este pedido?')) updateStatus('cancelled')
          }}
          disabled={!!loading}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-red-200 text-red-600 hover:border-red-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading === 'cancelled' ? 'Procesando...' : 'Cancelar'}
        </button>
      )}

      {error && (
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{error}</p>
      )}
    </div>
  )
}
