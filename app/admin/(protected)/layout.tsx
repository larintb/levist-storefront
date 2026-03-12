import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import AdminLogout from '@/components/admin/AdminLogout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-56 bg-black text-white flex flex-col flex-shrink-0 fixed h-full">

        {/* Logo */}
        <div className="px-6 py-8 border-b border-gray-800">
          <h1 className="text-2xl font-black italic tracking-tighter">LEVIST</h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-0.5">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-900 transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Pedidos
          </Link>
          <Link
            href="/admin/marketing"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-900 transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Marketing
          </Link>
          <Link
            href="/admin/descuentos"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-900 transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M17 17h.01M7 17L17 7M9 7a2 2 0 11-4 0 2 2 0 014 0zm10 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Descuentos
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-gray-900 transition-colors rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver tienda
          </Link>
        </nav>

        {/* User + Logout */}
        <div className="px-6 py-5 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 font-bold truncate mb-3">{user.email}</p>
          <AdminLogout />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>

    </div>
  )
}
