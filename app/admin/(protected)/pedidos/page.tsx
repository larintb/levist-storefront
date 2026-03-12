import { createServiceClient } from '@/lib/supabase'
import Link from 'next/link'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import OrderActions from '@/components/admin/OrderActions'

export const dynamic = 'force-dynamic'

interface OrderItem {
  product_name: string
  color: string
  size: string
  quantity: number
  price_at_sale: number
}

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  status: string
  total: number
  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
  items: OrderItem[]
}

async function getOrders(status?: string): Promise<Order[]> {
  const client = createServiceClient()
  let query = client.from('storefront_orders_view').select('*')
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return (data as Order[]) ?? []
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const STATUSES = [
  { key: 'all',       label: 'Todos' },
  { key: 'paid',      label: 'Por preparar' },
  { key: 'ready',     label: 'Listos p/ recoger' },
  { key: 'shipped',   label: 'En camino' },
  { key: 'picked_up', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
]

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const params    = await searchParams
  const current   = params.status ?? 'all'
  const orders    = await getOrders(current)

  const counts = {
    paid:      orders.filter(o => o.status === 'paid').length,
    ready:     orders.filter(o => o.status === 'ready').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
    picked_up: orders.filter(o => o.status === 'picked_up').length,
  }

  return (
    <div className="px-8 py-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Pedidos</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats rápidas */}
        <div className="hidden md:flex gap-4">
          {[
            { label: 'Por preparar', count: counts.paid,      color: 'bg-blue-50 text-blue-700' },
            { label: 'Listos',       count: counts.ready,     color: 'bg-[#EEF2F6] text-[#364458]' },
            { label: 'En camino',    count: counts.shipped,   color: 'bg-purple-50 text-purple-700' },
            { label: 'Entregados',   count: counts.picked_up, color: 'bg-green-50 text-green-700' },
          ].map(s => (
            <div key={s.label} className={`px-4 py-2 rounded text-center ${s.color}`}>
              <p className="text-xl font-black">{s.count}</p>
              <p className="text-[9px] font-black uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map((s) => (
          <Link
            key={s.key}
            href={s.key === 'all' ? '/admin/pedidos' : `/admin/pedidos?status=${s.key}`}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-colors ${
              current === s.key
                ? 'bg-[#364458] text-white border-[#364458]'
                : 'border-gray-200 text-gray-500 hover:border-[#364458] hover:text-[#364458]'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <p className="text-xs font-black uppercase tracking-widest">Sin pedidos en este estado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 overflow-hidden">

              {/* Header del card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-black text-sm">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <OrderStatusBadge status={order.status} />
                  {/* Método de entrega */}
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 ${
                    order.delivery_method === 'delivery'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {order.delivery_method === 'delivery' ? '🚚 Envío' : '📍 Recoger'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>
                    {new Date(order.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="text-black font-black text-base">{fmt(order.total)}</span>
                </div>
              </div>

              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Cliente */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Cliente</p>
                  <p className="font-black text-sm">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.customer_phone}</p>
                  {order.customer_email && (
                    <p className="text-xs text-gray-500">{order.customer_email}</p>
                  )}

                  {/* Dirección de entrega */}
                  {order.delivery_method === 'delivery' && order.delivery_address && (
                    <div className="mt-3 border-l-2 border-blue-300 pl-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">Dirección</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{order.delivery_address}</p>
                    </div>
                  )}
                  {order.delivery_method === 'pickup' && (
                    <div className="mt-3 border-l-2 border-gray-300 pl-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Recoge en</p>
                      <p className="text-xs text-gray-600">Caracol 10, Acuario 2001</p>
                    </div>
                  )}
                </div>

                {/* Artículos */}
                <div className="md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Artículos ({(order.items ?? []).length})
                  </p>
                  <div className="flex flex-col gap-1.5 mb-4">
                    {(order.items ?? []).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-bold text-gray-800">
                          {item.product_name}{' '}
                          <span className="font-normal text-gray-400">
                            · {item.color} · T.{item.size} ×{item.quantity}
                          </span>
                        </span>
                        <span className="text-gray-500 flex-shrink-0 ml-2 tabular-nums">
                          {fmt(item.price_at_sale * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Acciones */}
                  <OrderActions
                    orderId={order.id}
                    currentStatus={order.status}
                    customerEmail={order.customer_email}
                    customerName={order.customer_name}
                    deliveryMethod={order.delivery_method ?? 'pickup'}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
