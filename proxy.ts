import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ─── Bot detection ────────────────────────────────────────────────────────────

const SCRAPER_PATTERNS = [
  /python-requests/i,
  /go-http-client/i,
  /scrapy/i,
  /^curl\//i,
  /^wget\//i,
  /httpx/i,
  /java\//i,
  /okhttp/i,
  /^axios/i,
  /libwww-perl/i,
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /^node-fetch/i,
  /^undici/i,
  /^got\//i,
  /^aiohttp/i,
  /bot|crawler|spider|crawling/i,
]

// Legitimate SEO crawlers — never block these
const LEGITIMATE_BOTS = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit/i

function isBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua) return true
  if (LEGITIMATE_BOTS.test(ua)) return false
  return SCRAPER_PATTERNS.some((p) => p.test(ua))
}

function hasAnomalousParams(req: NextRequest): boolean {
  const { searchParams } = req.nextUrl
  const paramCount = [...searchParams.keys()].length
  if (paramCount > 5) return true
  for (const [, v] of searchParams.entries()) {
    if (v.length > 150) return true
  }
  return false
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ─── Bot protection for public pages ──────────────────────────────────────
  if (pathname.startsWith('/catalogo') || pathname === '/') {
    if (isBot(req) || hasAnomalousParams(req)) {
      return new NextResponse(null, { status: 400 })
    }
  }

  // Solo proteger /admin/* — excepto la página de login
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  let res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/catalogo/:path*', '/catalogo', '/'],
}
