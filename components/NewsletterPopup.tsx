'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'levist_popup_dismissed'

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [job, setJob] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  function close() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, job, source: 'own_your_shift_popup' })

    if (dbError && dbError.code !== '23505') {
      // 23505 = unique violation (already subscribed) — treat as success
      setError('Hubo un error. Intenta de nuevo.')
      return
    }

    setSubmitted(true)
    localStorage.setItem(STORAGE_KEY, '1')
    setTimeout(close, 2500)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 bg-[#364458]/60 z-[2000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white w-full max-w-2xl relative flex flex-col md:flex-row overflow-hidden shadow-2xl">
        {/* Image */}
        <div className="hidden md:block w-1/2 flex-shrink-0 relative min-h-[400px] overflow-hidden">
          {/* Blurred background */}
          <Image
            src="/images/test1.png"
            alt=""
            fill
            className="object-cover scale-110 blur-sm brightness-75"
            unoptimized
            aria-hidden
          />
          {/* Sharp image on top */}
          <Image
            src="/images/test1.png"
            alt="OWN YOUR SHIFT – LEVIST Uniformes"
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center text-center relative">
          <button
            onClick={close}
            className="absolute top-4 right-4 text-xl cursor-pointer text-gray-400 hover:text-[#364458]"
          >
            ✕
          </button>

          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-12 h-12 bg-[#8AA7C4] flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-black uppercase tracking-tighter">¡Listo! Tu código es</p>
              <p className="text-2xl font-black tracking-widest text-[#364458]">SHIFT15</p>
              <p className="text-xs text-gray-500">Revisa tu email para confirmar tu suscripción.</p>
            </div>
          ) : (
            <>
              <div className="text-4xl font-black italic tracking-tighter mb-1">LEVIST</div>
              <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                OWN YOUR SHIFT
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Campaña Exclusiva</p>
              <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                Suscríbete y obtén <strong>15% OFF</strong> con el código{' '}
                <span className="font-black tracking-widest text-[#364458]">SHIFT15</span>.
              </p>
              <p className="text-[10px] text-gray-400 mb-6 leading-relaxed border border-gray-200 px-3 py-2 bg-gray-50">
                * Válido únicamente en colores: <strong>Navy, Negro, Royal y White</strong>.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="TU EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-b-2 border-[#364458] w-full py-2 text-xs font-bold uppercase tracking-widest focus:outline-none placeholder:text-gray-400"
                />
                <select
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="border-b-2 border-[#364458] w-full py-2 text-xs font-bold uppercase tracking-widest focus:outline-none bg-transparent text-gray-700"
                >
                  <option value="">SELECCIONA TU PROFESIÓN</option>
                  <option value="doctor">Doctor/a</option>
                  <option value="nurse">Enfermero/a</option>
                  <option value="dentist">Dentista</option>
                  <option value="student">Estudiante</option>
                  <option value="other">Otro</option>
                </select>

                {error && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#364458] text-white py-4 font-black uppercase text-xs tracking-widest hover:bg-[#2F3F55] transition-colors mt-2"
                >
                  Quiero mi 15% OFF
                </button>
              </form>

              <button
                onClick={close}
                className="mt-4 text-[10px] font-bold underline uppercase tracking-widest text-gray-400 hover:text-[#364458] cursor-pointer"
              >
                No, gracias
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
