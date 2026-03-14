'use client'

import { useState, useEffect } from 'react'

interface Contact {
  id: string
  email: string
  name: string | null
  created_at: string
  active: boolean
}

interface WaContact {
  id: string
  phone: string
  name: string | null
  created_at: string
}

type Tab = 'contactos' | 'campana' | 'whatsapp'
type WaSubTab = 'contactos' | 'enviar'

export default function MarketingPage() {
  const [tab, setTab]           = useState<Tab>('contactos')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading]   = useState(true)

  // ── Email contacts ──────────────────────────────────────────────────────────
  const [importText, setImportText] = useState('')
  const [importing, setImporting]   = useState(false)
  const [importMsg, setImportMsg]   = useState('')

  async function loadContacts() {
    setLoading(true)
    const res = await fetch('/api/admin/marketing/contacts')
    const data = await res.json()
    setContacts(data.contacts ?? [])
    setLoading(false)
  }

  useEffect(() => { loadContacts() }, [])

  async function handleImport() {
    const emails = importText.split(/[\n,;]/).map(e => e.trim()).filter(e => e.includes('@'))
    if (emails.length === 0) { setImportMsg('No se encontraron correos válidos.'); return }
    setImporting(true); setImportMsg('')
    const res = await fetch('/api/admin/marketing/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    })
    const data = await res.json()
    if (!res.ok) { setImportMsg(`Error: ${data.error}`); setImporting(false); return }
    setImportMsg(`✓ ${data.added} contacto${data.added !== 1 ? 's' : ''} agregado${data.added !== 1 ? 's' : ''} (duplicados ignorados)`)
    setImportText('')
    await loadContacts()
    setImporting(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/admin/marketing/contacts', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  // ── Email campaign ──────────────────────────────────────────────────────────
  const [subject, setSubject]     = useState('')
  const [heading, setHeading]     = useState('')
  const [message, setMessage]     = useState('')
  const [ctaText, setCtaText]     = useState('')
  const [ctaUrl, setCtaUrl]       = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending]     = useState(false)
  const [sendMsg, setSendMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

  async function handleSend(isTest: boolean) {
    if (!subject || !heading || !message) {
      setSendMsg({ type: 'err', text: 'Completa asunto, título y mensaje.' }); return
    }
    if (isTest && !testEmail) {
      setSendMsg({ type: 'err', text: 'Escribe un correo de prueba.' }); return
    }
    setSending(true); setSendMsg(null); setConfirmSend(false)
    const res = await fetch('/api/admin/marketing/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, heading, message,
        cta_text: ctaText || undefined, cta_url: ctaUrl || undefined,
        test_email: isTest ? testEmail : undefined }),
    })
    const data = await res.json()
    if (!res.ok) setSendMsg({ type: 'err', text: data.error ?? 'Error al enviar' })
    else if (isTest) setSendMsg({ type: 'ok', text: `✓ Correo de prueba enviado a ${testEmail}` })
    else setSendMsg({ type: 'ok', text: `✓ Campaña enviada a ${data.sent} contactos` })
    setSending(false)
  }

  // ── WhatsApp contacts ───────────────────────────────────────────────────────
  const [waSubTab, setWaSubTab]       = useState<WaSubTab>('contactos')
  const [waContacts, setWaContacts]   = useState<WaContact[]>([])
  const [waLoading, setWaLoading]     = useState(true)
  const [waImportText, setWaImportText] = useState('')
  const [waImporting, setWaImporting] = useState(false)
  const [waImportMsg, setWaImportMsg] = useState('')

  async function loadWaContacts() {
    setWaLoading(true)
    const res = await fetch('/api/admin/marketing/whatsapp-contacts')
    const data = await res.json()
    setWaContacts(data.contacts ?? [])
    setWaLoading(false)
  }

  useEffect(() => { if (tab === 'whatsapp') loadWaContacts() }, [tab])

  async function handleWaImport() {
    const phones = waImportText.split(/[\n,;]/).map(p => p.trim()).filter(Boolean)
    if (phones.length === 0) { setWaImportMsg('No se encontraron números.'); return }
    setWaImporting(true); setWaImportMsg('')
    const res = await fetch('/api/admin/marketing/whatsapp-contacts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones }),
    })
    const data = await res.json()
    if (!res.ok) { setWaImportMsg(`Error: ${data.error}`); setWaImporting(false); return }
    setWaImportMsg(`✓ ${data.added} número${data.added !== 1 ? 's' : ''} agregado${data.added !== 1 ? 's' : ''} (duplicados ignorados)`)
    setWaImportText('')
    await loadWaContacts()
    setWaImporting(false)
  }

  async function handleWaDelete(id: string) {
    await fetch('/api/admin/marketing/whatsapp-contacts', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setWaContacts(prev => prev.filter(c => c.id !== id))
  }

  // ── WhatsApp send ───────────────────────────────────────────────────────────
  const [waMessage, setWaMessage]   = useState('')
  const [waSendMode, setWaSendMode] = useState<'contacts' | 'manual'>('contacts')
  const [waManual, setWaManual]     = useState('')
  const [waSending, setWaSending]   = useState(false)
  const [waMsg, setWaMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [waConfirm, setWaConfirm]   = useState(false)

  const manualPhones = waManual.split(/[\n,;]/).map(p => p.trim()).filter(Boolean)
  const waTargetCount = waSendMode === 'contacts' ? waContacts.length : manualPhones.length

  async function handleWaSend() {
    if (!waMessage.trim()) {
      setWaMsg({ type: 'err', text: 'Escribe un mensaje.' }); return
    }
    if (waSendMode === 'manual' && manualPhones.length === 0) {
      setWaMsg({ type: 'err', text: 'Agrega al menos un número.' }); return
    }
    setWaSending(true); setWaMsg(null); setWaConfirm(false)
    const body = waSendMode === 'contacts'
      ? { all_contacts: true, message: waMessage }
      : { phones: manualPhones, message: waMessage }
    const res = await fetch('/api/admin/marketing/whatsapp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) setWaMsg({ type: 'err', text: data.error ?? 'Error al enviar' })
    else {
      const failedText = data.failed?.length ? ` (${data.failed.length} fallaron)` : ''
      setWaMsg({ type: 'ok', text: `✓ Enviado a ${data.sent} número${data.sent !== 1 ? 's' : ''}${failedText}` })
    }
    setWaSending(false)
  }

  const activeCount = contacts.filter(c => c.active).length

  return (
    <div className="px-8 py-8 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Marketing</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
          {activeCount} contacto{activeCount !== 1 ? 's' : ''} email · {waContacts.length} WA
        </p>
      </div>

      {/* Tabs principales */}
      <div className="flex gap-0 mb-8 border-b border-gray-200">
        {([
          { key: 'contactos', label: 'Contactos Email' },
          { key: 'campana',   label: 'Campaña Email' },
          { key: 'whatsapp',  label: 'WhatsApp' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors cursor-pointer -mb-px ${
              tab === t.key ? 'border-[#364458] text-black' : 'border-transparent text-gray-400 hover:text-[#364458]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CONTACTOS EMAIL ── */}
      {tab === 'contactos' && (
        <div className="flex flex-col gap-8">
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-[10px] font-black uppercase tracking-widest mb-4">Agregar correos</p>
            <p className="text-xs text-gray-500 mb-3">Pega correos separados por coma, punto y coma o salto de línea.</p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={'cliente@ejemplo.com\notro@correo.com, otro2@correo.com'}
              rows={5}
              className="w-full border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#364458] transition-colors resize-none mb-3"
            />
            {importMsg && (
              <p className={`text-xs font-bold mb-3 ${importMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {importMsg}
              </p>
            )}
            <button
              onClick={handleImport}
              disabled={importing || !importText.trim()}
              className="px-5 py-2.5 bg-[#364458] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors cursor-pointer disabled:opacity-40"
            >
              {importing ? 'Importando…' : 'Agregar contactos'}
            </button>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest">Lista de contactos ({contacts.length})</p>
            </div>
            {loading ? (
              <div className="px-6 py-8 text-xs text-gray-400">Cargando…</div>
            ) : contacts.length === 0 ? (
              <div className="px-6 py-8 text-xs text-gray-400">Sin contactos aún.</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{c.email}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: CAMPAÑA EMAIL ── */}
      {tab === 'campana' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 p-6 flex flex-col gap-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Componer campaña</p>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Asunto *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Ej. 🔥 Rebajas de fin de temporada — hasta 40% off"
                className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Título del email *</label>
              <input type="text" value={heading} onChange={e => setHeading(e.target.value)}
                placeholder="Ej. REBAJAS DE FIN DE TEMPORADA"
                className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Mensaje *</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6}
                placeholder="Escribe el cuerpo del correo. Cada línea se convierte en un párrafo."
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#364458] transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">CTA Texto <span className="normal-case font-normal">(opcional)</span></label>
                <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)}
                  placeholder="Ver ofertas"
                  className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">CTA URL <span className="normal-case font-normal">(opcional)</span></label>
                <input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                  placeholder="https://levistuniforms.com"
                  className="w-full border-b-2 border-gray-200 pb-2 text-sm font-bold focus:outline-none focus:border-[#364458] transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3">Enviar prueba</p>
            <div className="flex gap-3">
              <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="flex-1 border-b-2 border-gray-300 pb-2 text-sm font-bold bg-transparent focus:outline-none focus:border-[#364458] transition-colors" />
              <button onClick={() => handleSend(true)} disabled={sending}
                className="px-5 py-2 border border-gray-300 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:border-[#364458] hover:text-[#364458] transition-colors cursor-pointer disabled:opacity-40">
                {sending ? 'Enviando…' : 'Enviar prueba'}
              </button>
            </div>
          </div>

          {sendMsg && (
            <p className={`text-xs font-bold ${sendMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{sendMsg.text}</p>
          )}

          {!confirmSend ? (
            <button onClick={() => setConfirmSend(true)} disabled={sending || activeCount === 0}
              className="w-full py-4 bg-[#364458] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors cursor-pointer disabled:opacity-40">
              Enviar campaña a {activeCount} contacto{activeCount !== 1 ? 's' : ''} →
            </button>
          ) : (
            <div className="border border-[#364458] p-5 flex flex-col gap-4">
              <p className="text-xs font-black uppercase tracking-widest">¿Confirmas enviar a {activeCount} contactos?</p>
              <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => handleSend(false)} disabled={sending}
                  className="px-6 py-3 bg-[#364458] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#2F3F55] transition-colors cursor-pointer disabled:opacity-40">
                  {sending ? 'Enviando…' : 'Sí, enviar ahora'}
                </button>
                <button onClick={() => setConfirmSend(false)}
                  className="px-6 py-3 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-[#364458] hover:text-[#364458] transition-colors cursor-pointer">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: WHATSAPP ── */}
      {tab === 'whatsapp' && (
        <div className="flex flex-col gap-6">

          {/* Sub-tabs */}
          <div className="flex gap-0 border-b border-gray-100">
            {([
              { key: 'contactos', label: `Contactos (${waContacts.length})` },
              { key: 'enviar',    label: 'Enviar notificación' },
            ] as { key: WaSubTab; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setWaSubTab(t.key)}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors cursor-pointer -mb-px ${
                  waSubTab === t.key ? 'border-[#25D366] text-black' : 'border-transparent text-gray-400 hover:text-black'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── SUB: CONTACTOS WA ── */}
          {waSubTab === 'contactos' && (
            <div className="flex flex-col gap-8 max-w-2xl">
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4">Agregar números</p>
                <p className="text-xs text-gray-500 mb-3">
                  Uno por línea o separados por coma. Acepta formato mexicano (10 dígitos) y estadounidense.
                </p>
                <textarea
                  value={waImportText}
                  onChange={e => setWaImportText(e.target.value)}
                  placeholder={'8681234567\n+12125551234\n521XXXXXXXXXX'}
                  rows={5}
                  className="w-full border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#25D366] transition-colors resize-none mb-3"
                />
                {waImportMsg && (
                  <p className={`text-xs font-bold mb-3 ${waImportMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {waImportMsg}
                  </p>
                )}
                <button
                  onClick={handleWaImport}
                  disabled={waImporting || !waImportText.trim()}
                  className="px-5 py-2.5 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1fba57] transition-colors cursor-pointer disabled:opacity-40"
                >
                  {waImporting ? 'Importando…' : 'Agregar contactos'}
                </button>
              </div>

              <div className="bg-white border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest">Lista de contactos ({waContacts.length})</p>
                </div>
                {waLoading ? (
                  <div className="px-6 py-8 text-xs text-gray-400">Cargando…</div>
                ) : waContacts.length === 0 ? (
                  <div className="px-6 py-8 text-xs text-gray-400">Sin contactos aún.</div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                    {waContacts.map(c => (
                      <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{c.phone}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleWaDelete(c.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SUB: ENVIAR ── */}
          {waSubTab === 'enviar' && (
            <div className="flex flex-col gap-6 max-w-2xl">

              {/* Selector de destinatarios */}
              <div className="bg-white border border-gray-200 p-6 flex flex-col gap-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destinatarios</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWaSendMode('contacts')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 transition-colors cursor-pointer ${
                      waSendMode === 'contacts'
                        ? 'border-[#25D366] text-[#25D366] bg-green-50'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    Todos los contactos WA ({waContacts.length})
                  </button>
                  <button
                    onClick={() => setWaSendMode('manual')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-2 transition-colors cursor-pointer ${
                      waSendMode === 'manual'
                        ? 'border-[#25D366] text-[#25D366] bg-green-50'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    Números manuales
                  </button>
                </div>

                {waSendMode === 'manual' && (
                  <textarea
                    value={waManual}
                    onChange={e => setWaManual(e.target.value)}
                    placeholder={'8681234567\n+12125551234'}
                    rows={4}
                    className="w-full border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#25D366] transition-colors resize-none"
                  />
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    value={waMessage}
                    onChange={e => setWaMessage(e.target.value)}
                    placeholder={'Ej. Hola, tenemos nuevos productos disponibles 💛\nVisita levistuniforms.com'}
                    rows={5}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#25D366] transition-colors resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{waMessage.length} caracteres</p>
                </div>
              </div>

              {waMsg && (
                <p className={`text-xs font-bold ${waMsg.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                  {waMsg.text}
                </p>
              )}

              {!waConfirm ? (
                <button
                  onClick={() => {
                    if (!waMessage.trim() || waTargetCount === 0) {
                      setWaMsg({ type: 'err', text: 'Agrega destinatarios y escribe el mensaje.' }); return
                    }
                    setWaConfirm(true); setWaMsg(null)
                  }}
                  disabled={waSending || waTargetCount === 0}
                  className="w-full py-4 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1fba57] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Enviar a {waTargetCount} número{waTargetCount !== 1 ? 's' : ''} →
                </button>
              ) : (
                <div className="border border-[#25D366] p-5 flex flex-col gap-4">
                  <p className="text-xs font-black uppercase tracking-widest">
                    ¿Confirmas enviar a {waTargetCount} número{waTargetCount !== 1 ? 's' : ''}?
                  </p>
                  <p className="text-xs text-gray-500">
                    Se enviarán con un delay de 1.5s entre mensajes para evitar bloqueos.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleWaSend}
                      disabled={waSending}
                      className="px-6 py-3 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1fba57] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {waSending ? 'Enviando…' : 'Sí, enviar ahora'}
                    </button>
                    <button
                      onClick={() => setWaConfirm(false)}
                      className="px-6 py-3 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-[#364458] hover:text-[#364458] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  )
}
