'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      setLoading(false)
      return
    }

    router.push('/admin/pedidos')

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter">LEVIST</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
            Panel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 p-8">
          <h2 className="text-xs font-black uppercase tracking-widest mb-8">Iniciar Sesión</h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border-b-2 border-gray-300 pb-2 text-sm font-bold focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-colors ${
                loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 cursor-pointer'
              }`}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">
          Solo personal autorizado
        </p>
      </div>
    </div>
  )
}
