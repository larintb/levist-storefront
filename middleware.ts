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
]

// Legitimate SEO crawlers — never block these
const LEGITIMATE_BOTS = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit/i

function isBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') ?? ''
  if (!ua) return true
  if (LEGITIMATE_BOTS.test(ua)) return false
  return SCRAPER_PATTERNS.some((p) => p.test(ua))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ─── Bot protection for public pages ──────────────────────────────────────
  if (pathname.startsWith('/catalogo') || pathname === '/') {
    if (isBot(req)) {
      return new NextResponse(null, { status: 429, headers: { 'Retry-After': '60' } })
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
