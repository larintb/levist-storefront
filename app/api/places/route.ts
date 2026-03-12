import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// GET /api/places?input=calle+morelos   → suggestions
// GET /api/places?placeId=ChIJ...       → address components

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const input   = searchParams.get('input')
  const placeId = searchParams.get('placeId')

  if (!API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not set' }, { status: 500 })
  }

  // ── Autocomplete ──────────────────────────────────────────────────────────
  if (input) {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'suggestions.placePrediction.placeId',
          'suggestions.placePrediction.text',
          'suggestions.placePrediction.structuredFormat',
        ].join(','),
      },
      body: JSON.stringify({
        input,
        regionCode: 'MX',
        languageCode: 'es',
        locationRestriction: {
          rectangle: {
            low:  { latitude: 25.75, longitude: -97.65 },
            high: { latitude: 26.00, longitude: -97.35 },
          },
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[places autocomplete] Google error:', JSON.stringify(data))
      return NextResponse.json({ error: data?.error?.message ?? 'Google API error' }, { status: res.status })
    }

    return NextResponse.json(data)
  }

  // ── Place Details ─────────────────────────────────────────────────────────
  if (placeId) {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'addressComponents,formattedAddress',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[places details] Google error:', JSON.stringify(data))
      return NextResponse.json({ error: data?.error?.message ?? 'Google API error' }, { status: res.status })
    }

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Provide input or placeId' }, { status: 400 })
}
