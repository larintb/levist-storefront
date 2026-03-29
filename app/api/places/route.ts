import { NextRequest, NextResponse } from 'next/server'

const TOKEN   = process.env.MAPBOX_ACCESS_TOKEN!
const PROXIMITY = '-97.52131975816589,25.860658261552587'
const BBOX      = '-97.65,25.75,-97.35,26.00'

/**
 * GET /api/places?input=TEXT&session=UUID  → Mapbox Search Box suggest (dropdown)
 * GET /api/places?id=MAPBOX_ID&session=UUID → Mapbox Search Box retrieve (full address)
 */
export async function GET(req: NextRequest) {
  if (!TOKEN) {
    return NextResponse.json({ error: 'MAPBOX_ACCESS_TOKEN not set' }, { status: 500 })
  }

  const { searchParams } = req.nextUrl
  const input   = searchParams.get('input')
  const id      = searchParams.get('id')
  const session = searchParams.get('session') ?? 'default'

  // ── Suggest ───────────────────────────────────────────────────────────────
  if (input) {
    const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest')
    url.searchParams.set('q',             input)
    url.searchParams.set('access_token',  TOKEN)
    url.searchParams.set('session_token', session)
    url.searchParams.set('country',       'MX')
    url.searchParams.set('language',      'es')
    url.searchParams.set('proximity',     PROXIMITY)
    url.searchParams.set('bbox',          BBOX)
    url.searchParams.set('types',         'address')
    url.searchParams.set('limit',         '5')

    const res  = await fetch(url.toString())
    const data = await res.json()
    if (!res.ok) {
      console.error('[places/suggest]', JSON.stringify(data))
      return NextResponse.json({ error: data?.message ?? 'Mapbox error' }, { status: res.status })
    }
    return NextResponse.json(data)
  }

  // ── Retrieve ──────────────────────────────────────────────────────────────
  if (id) {
    const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(id)}`)
    url.searchParams.set('access_token',  TOKEN)
    url.searchParams.set('session_token', session)

    const res  = await fetch(url.toString())
    const data = await res.json()
    if (!res.ok) {
      console.error('[places/retrieve]', JSON.stringify(data))
      return NextResponse.json({ error: data?.message ?? 'Mapbox error' }, { status: res.status })
    }
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Provide input or id' }, { status: 400 })
}
