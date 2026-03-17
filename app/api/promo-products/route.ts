import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { FitProduct } from '@/app/api/complete-fit/route'

const VIEW = 'full_inventory_details'
const SIZE_ORDER = ['2XS','XXS','XS','S','M','L','XL','XXL','2XL','XXXL','3XL','4XL','5XL','6XL']

function sizeSort(a: string, b: string): number {
  const ai = SIZE_ORDER.indexOf(a.toUpperCase())
  const bi = SIZE_ORDER.indexOf(b.toUpperCase())
  if (ai !== -1 && bi !== -1) return ai - bi
  if (ai !== -1) return -1
  if (bi !== -1) return 1
  return a.localeCompare(b)
}

type Row = {
  product_id: string
  product_name: string
  product_image: string | null
  color: string
  size: string
  price: number
  stock: number
  inventory_id: string
}

function groupRows(rows: Row[]): FitProduct[] {
  const byId = new Map<string, Row[]>()
  for (const row of rows) {
    if (!byId.has(row.product_id)) byId.set(row.product_id, [])
    byId.get(row.product_id)!.push(row)
  }
  return Array.from(byId.values()).map((prows) => ({
    product_id: prows[0].product_id,
    product_name: prows[0].product_name,
    image_url: prows[0].product_image,
    color: prows[0].color,
    min_price: Math.min(...prows.map(r => r.price)),
    sizes: prows
      .map(r => ({ inventory_id: r.inventory_id, size: r.size, price: r.price, stock: r.stock }))
      .sort((a, b) => sizeSort(a.size, b.size)),
  }))
}

type FindType = 'bata' | 'jacket' | 'scrub' | 'set' | 'default'

async function fetchByCategory(
  supabase: ReturnType<typeof getSupabase>,
  find: FindType,
  excludeIds: string[],
  perLimit: number
): Promise<Row[]> {
  let query = supabase
    .from(VIEW)
    .select('product_id, product_name, product_image, color, size, price, stock, inventory_id')
    .gt('stock', 1)
    .neq('color', 'ADO')
    .order('product_name')
    .limit(perLimit)

  for (const id of excludeIds) query = query.neq('product_id', id)

  switch (find) {
    case 'bata':
      query = query.or('product_name.ilike.%bata%,product_name.ilike.%lab coat%,product_name.ilike.%lab%coat%')
      break
    case 'jacket':
      query = query.or('product_name.ilike.%jacket%,product_name.ilike.%chamarra%')
      break
    case 'set':
      query = query.ilike('product_name', '%set%')
      break
    case 'scrub':
      // Regular scrubs: not bata, not jacket/chamarra, not set
      query = query
        .not('product_name', 'ilike', '%bata%')
        .not('product_name', 'ilike', '%lab coat%')
        .not('product_name', 'ilike', '%jacket%')
        .not('product_name', 'ilike', '%chamarra%')
        .not('product_name', 'ilike', '%set%')
      break
    default: {
      // Keyword-based fallback (gorritos, calcetas, jackets, etc.)
      const keywords = ['gorrit', 'calcet', 'jacket', 'chamarra', 'gorro', 'cap', 'sock']
      const orFilter = keywords.map(k => `product_name.ilike.%${k}%`).join(',')
      query = query.or(orFilter)
      break
    }
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as Row[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const findParam  = searchParams.get('find') ?? 'default'       // e.g. "bata,jacket" or "scrub,bata"
  const excludeParam = searchParams.get('exclude') ?? ''
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '6', 10), 12)

  const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : []
  const finds = findParam.split(',').filter(Boolean) as FindType[]

  const supabase = getSupabase()
  const perLimit = Math.ceil((limit * 3) / Math.max(finds.length, 1))

  // Fetch each category in parallel
  const allResults = await Promise.all(
    finds.map(f => fetchByCategory(supabase, f, excludeIds, perLimit))
  )

  // Interleave results so each category is represented
  const seenIds = new Set<string>(excludeIds)
  const merged: Row[] = []

  const maxLen = Math.max(...allResults.map(r => r.length))
  for (let i = 0; i < maxLen; i++) {
    for (const rows of allResults) {
      const row = rows[i]
      if (row && !seenIds.has(row.product_id)) {
        seenIds.add(row.product_id)
        merged.push(row)
      }
    }
  }

  // If nothing matched any category, fall back to default keyword search
  if (merged.length === 0) {
    const fallback = await fetchByCategory(supabase, 'default', excludeIds, limit * 3)
    for (const row of fallback) {
      if (!seenIds.has(row.product_id)) {
        seenIds.add(row.product_id)
        merged.push(row)
      }
    }
  }

  const grouped = groupRows(merged)
  return NextResponse.json(grouped.slice(0, limit))
}
