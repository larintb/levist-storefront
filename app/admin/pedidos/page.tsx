import { createServiceClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
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
  items: OrderItem[]
}

async function getOrders(status?: string): Promise<Order[]> {
  const client = createServiceClient()
  let query = client.from('storefront_orders_view').select('*')
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) { console.error('Error fetching orders:', error); return [] }
  return (data as Order[]) ?? []
}

interface PageProps {
  searchParams: Promise<{ status?: string; secret?: string }>
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const params = await searchParams

  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret && params.secret !== adminSecret) redirect('/')

  const currentStatus = params.status ?? 'all'
  const orders = await getOrders(currentStatus)

  const statuses = [
    { key: 'all',       label: 'Todos' },
    { key: 'paid',      label: 'Pagados ⏳' },
    { key: 'ready',     label: 'Listos 📦' },
    { key: 'picked_up', label: 'Entregados ✓' },
    { key: 'cancelled', label: 'Cancelados' },
  ]

  const makeUrl = (s: string) => {
    const p = new URLSearchParams()
    if (adminSecret) p.set('secret', params.secret ?? '')
    if (s !== 'all') p.set('status', s)
    const qs = p.toString()
    return `/admin/pedidos${qs ? `?${qs}` : ''}`
  }

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Panel de Pedidos</h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-1">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} · Solo pedidos online (Stripe)
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-8">
        {statuses.map((s) => (
          <Link
            key={s.key}
            href={makeUrl(s.key)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border transition-colors ${
              currentStatus === s.key
                ? 'bg-black text-white border-black'
                : 'border-gray-300 text-gray-600 hover:border-black'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xs font-black uppercase tracking-widest">Sin pedidos en este estado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 bg-white">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-black text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>
                    {new Date(order.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="text-black font-black text-sm">{fmt(order.total)}</span>
                </div>
              </div>

              {/* Detalle */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cliente */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cliente</p>
                  <p className="font-black text-sm">{order.customer_name}</p>
                  <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  {order.customer_email && (
                    <p className="text-xs text-gray-500">{order.customer_email}</p>
                  )}
                </div>

                {/* Artículos */}
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Artículos ({(order.items ?? []).length})
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {(order.items ?? []).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-bold text-gray-800">
                          {item.product_name}{' '}
                          <span className="font-normal text-gray-500">
                            · {item.color} · T.{item.size} ×{item.quantity}
                          </span>
                        </span>
                        <span className="text-gray-500 flex-shrink-0 ml-2">
                          {fmt(item.price_at_sale * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <OrderActions
                  orderId={order.id}
                  currentStatus={order.status}
                  secret={params.secret}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
