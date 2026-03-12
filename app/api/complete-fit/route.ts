import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

const VIEW = 'full_inventory_details'
const MIN_STOCK = 1
const SIZE_ORDER = ['2XS','XXS','XS','S','M','L','XL','XXL','2XL','XXXL','3XL','4XL','5XL','6XL']

function sizeSort(a: string, b: string): number {
  const ai = SIZE_ORDER.indexOf(a.toUpperCase())
  const bi = SIZE_ORDER.indexOf(b.toUpperCase())
  if (ai !== -1 && bi !== -1) return ai - bi
  if (ai !== -1) return -1
  if (bi !== -1) return 1
  return a.localeCompare(b)
}

export interface FitProduct {
  product_id: string
  product_name: string
  image_url: string | null
  color: string
  min_price: number
  sizes: { inventory_id: string; size: string; price: number; stock: number }[]
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
  brand: string | null
  collection: string | null
}

type SourceMeta = { brand: string | null; collection: string | null }

async function getSourceMeta(supabase: ReturnType<typeof getSupabase>, sourceId: string): Promise<SourceMeta> {
  const { data } = await supabase
    .from(VIEW)
    .select('brand, collection')
    .eq('product_id', sourceId)
    .limit(1)
    .single()
  return (data as SourceMeta | null) ?? { brand: null, collection: null }
}

// Groups rows by product_id, scores by brand/collection match, returns top N
function groupTopProducts(data: Row[], sourceMeta: SourceMeta, max = 2): FitProduct[] {
  if (!data.length) return []

  const byId = new Map<string, Row[]>()
  for (const row of data) {
    if (!byId.has(row.product_id)) byId.set(row.product_id, [])
    byId.get(row.product_id)!.push(row)
  }

  const scored = Array.from(byId.values()).map((rows) => {
    const r = rows[0]
    const sameBrand = sourceMeta.brand && r.brand &&
      r.brand.toLowerCase() === sourceMeta.brand.toLowerCase()
    const sameColl = sourceMeta.collection && r.collection &&
      r.collection.toLowerCase() === sourceMeta.collection.toLowerCase()
    const score = sameBrand && sameColl ? 2 : sameBrand ? 1 : 0
    return { rows, score }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, max).map(({ rows }) => ({
    product_id: rows[0].product_id,
    product_name: rows[0].product_name,
    image_url: rows[0].product_image,
    color: rows[0].color,
    min_price: Math.min(...rows.map(r => r.price)),
    sizes: rows
      .map(r => ({ inventory_id: r.inventory_id, size: r.size, price: r.price, stock: r.stock }))
      .sort((a, b) => sizeSort(a.size, b.size)),
  }))
}

// Returns only the first product (used for bata kit)
function groupFirstProduct(data: Row[]): FitProduct | null {
  if (!data.length) return null
  const firstId = data[0].product_id
  const rows = data.filter(r => r.product_id === firstId)
  return {
    product_id: rows[0].product_id,
    product_name: rows[0].product_name,
    image_url: rows[0].product_image,
    color: rows[0].color,
    min_price: Math.min(...rows.map(r => r.price)),
    sizes: rows
      .map(r => ({ inventory_id: r.inventory_id, size: r.size, price: r.price, stock: r.stock }))
      .sort((a, b) => sizeSort(a.size, b.size)),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const find    = searchParams.get('find') ?? 'pant'   // 'pant' | 'white_top' | 'white_pant'
  const color   = searchParams.get('color')
  const exclude = searchParams.get('exclude')

  const supabase = getSupabase()
  const base = supabase
    .from(VIEW)
    .select('product_id, product_name, product_image, color, size, price, stock, inventory_id, brand, collection')
    .gt('stock', MIN_STOCK)
    .neq('color', 'ADO')
    .order('product_name')

  if (find === 'pant') {
    // Pantalón del mismo color — prioriza misma marca+colección que el trigger
    if (!color) return NextResponse.json([])
    let query = base.ilike('product_name', '%pant%').ilike('color', color)
    if (exclude) query = query.neq('product_id', exclude)

    const [{ data, error }, sourceMeta] = await Promise.all([
      query,
      exclude ? getSourceMeta(supabase, exclude) : Promise.resolve<SourceMeta>({ brand: null, collection: null }),
    ])

    if (error || !data || data.length === 0) return NextResponse.json([])
    return NextResponse.json(groupTopProducts(data as Row[], sourceMeta, 2))

  } else if (find === 'white_pant') {
    // Pantalón blanco (para bata kit)
    let query = base.ilike('product_name', '%pant%').ilike('color', 'white')
    if (exclude) query = query.neq('product_id', exclude)
    const { data, error } = await query
    if (error || !data || data.length === 0) return NextResponse.json(null)
    return NextResponse.json(groupFirstProduct(data as Row[]))

  } else if (find === 'white_top') {
    // Filipina blanca (para bata kit)
    let query = base
      .not('product_name', 'ilike', '%pant%')
      .not('product_name', 'ilike', '%bata%')
      .not('product_name', 'ilike', '%lab coat%')
      .not('product_name', 'ilike', '%set%')
      .ilike('color', 'white')
    if (exclude) query = query.neq('product_id', exclude)
    const { data, error } = await query
    if (error || !data || data.length === 0) return NextResponse.json(null)
    return NextResponse.json(groupFirstProduct(data as Row[]))

  } else {
    return NextResponse.json(null)
  }
}
