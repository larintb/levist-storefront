export default function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending:   { label: 'Pendiente',   className: 'bg-gray-100 text-gray-600' },
    paid:      { label: 'Pagado',      className: 'bg-blue-100 text-blue-700' },
    ready:     { label: 'Listo',       className: 'bg-yellow-400 text-black' },
    picked_up: { label: 'Entregado',   className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelado',   className: 'bg-red-100 text-red-600' },
  }

  const { label, className } = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-block px-2 py-1 text-[10px] font-black uppercase tracking-widest ${className}`}>
      {label}
    </span>
  )
}
