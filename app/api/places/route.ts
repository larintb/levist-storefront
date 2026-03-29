import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.MAPBOX_ACCESS_TOKEN!

const STORE_LON = -97.52131975816589
const STORE_LAT = 25.860658261552587

// GET /api/places?input=calle+morelos  → suggestions with full address data (Mapbox Geocoding v6)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const input = searchParams.get('input')

  if (!TOKEN) {
    return NextResponse.json({ error: 'MAPBOX_ACCESS_TOKEN not set' }, { status: 500 })
  }

  if (!input) {
    return NextResponse.json({ error: 'Provide input' }, { status: 400 })
  }

  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward')
  url.searchParams.set('q', input)
  url.searchParams.set('access_token', TOKEN)
  url.searchParams.set('country', 'MX')
  url.searchParams.set('language', 'es')
  url.searchParams.set('proximity', `${STORE_LON},${STORE_LAT}`)
  url.searchParams.set('types', 'address')
  url.searchParams.set('limit', '5')
  // Restrict to Matamoros bounding box
  url.searchParams.set('bbox', '-97.65,25.75,-97.35,26.00')

  const res = await fetch(url.toString())
  const data = await res.json()

  if (!res.ok) {
    console.error('[places] Mapbox error:', JSON.stringify(data))
    return NextResponse.json({ error: data?.message ?? 'Mapbox API error' }, { status: res.status })
  }

  return NextResponse.json(data)
}
