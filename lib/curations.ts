import { getSupabase } from './supabase'
import { groupRows } from './catalog'
import type { Product } from '@/types/product'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CuratedItem {
  product: Product
  role: 'top' | 'bottom'
  fitLabel?: string
}

export interface CurationResult {
  key: string
  title: string
  subtitle?: string
  items: CuratedItem[]
}

// ─── Keyword → curation key mapping ──────────────────────────────────────────

const KEYWORD_MAP: [string, string[]][] = [
  ['uniform', ['uniform', 'uniforme', 'uniformes']],
]

export function detectCuration(query?: string): string | null {
  if (!query) return null
  const q = query.toLowerCase().trim()
  for (const [key, keywords] of KEYWORD_MAP) {
    if (keywords.some(kw => q.includes(kw) || kw.includes(q))) return key
  }
  return null
}

// ─── SKU pair definitions ─────────────────────────────────────────────────────
//
// Each entry: [topSku, bottomSku]
// Order here = order on screen (groups of 4: hombre_top | hombre_bottom | mujer_top | mujer_bottom)

const UNIFORM_PAIRS: [string, string][] = [
  ['6355',  '5355' ],
  ['SK101', 'SK201'],
  ['6380',  '5380' ],
  ['6755',  '5155P'],
  ['6155',  '5155' ],
]

// ─── Fetch by SKUs ────────────────────────────────────────────────────────────

async function fetchProductsBySku(skus: string[]): Promise<Map<string, Product>> {
  const supabase = getSupabase()
  const upper = skus.map(s => s.toUpperCase())

  const { data, error } = await supabase
    .from('full_inventory_details')
    .select('*')
    .in('sku', upper)
    .gt('stock', 0)

  if (error || !data) return new Map()

  const products = groupRows(data)
  const bySkuMap = new Map<string, Product>()
  for (const p of products) {
    if (p.sku) bySkuMap.set(p.sku.toUpperCase(), p)
  }
  return bySkuMap
}

// ─── Curation: "uniform / uniforme" ──────────────────────────────────────────

async function getCuratedUniform(): Promise<CurationResult> {
  // Collect all unique SKUs needed
  const allSkus = [...new Set(UNIFORM_PAIRS.flat())]
  const bySkuMap = await fetchProductsBySku(allSkus)

  const items: CuratedItem[] = []

  for (const [topSku, bottomSku] of UNIFORM_PAIRS) {
    const top    = bySkuMap.get(topSku.toUpperCase())
    const bottom = bySkuMap.get(bottomSku.toUpperCase())

    if (top)    items.push({ product: top,    role: 'top' })
    if (bottom) items.push({ product: bottom, role: 'bottom', fitLabel: 'Completar Fit' })
  }

  return {
    key: 'uniform',
    title: 'Uniformes Completos',
    subtitle: 'Scrubs y pants coordinados',
    items,
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function getCuration(key: string): Promise<CurationResult | null> {
  if (key === 'uniform') return getCuratedUniform()
  return null
}
