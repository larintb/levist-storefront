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

type Row = { product_id: string; product_name: string; product_image: string | null; color: string; size: string; price: number; stock: number; inventory_id: string }

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
    .select('product_id, product_name, product_image, color, size, price, stock, inventory_id')
    .gt('stock', MIN_STOCK)
    .neq('color', 'ADO')
    .order('product_name')

  let query = base

  if (find === 'pant') {
    // Pantalón del mismo color que el top
    if (!color) return NextResponse.json(null)
    query = query.ilike('product_name', '%pant%').ilike('color', color)
    if (exclude) query = query.neq('product_id', exclude)

  } else if (find === 'white_pant') {
    // Pantalón blanco (para bata kit)
    query = query.ilike('product_name', '%pant%').ilike('color', 'white')
    if (exclude) query = query.neq('product_id', exclude)

  } else if (find === 'white_top') {
    // Filipina blanca (no pant, no bata/lab coat, no set)
    query = query
      .not('product_name', 'ilike', '%pant%')
      .not('product_name', 'ilike', '%bata%')
      .not('product_name', 'ilike', '%lab coat%')
      .not('product_name', 'ilike', '%set%')
      .ilike('color', 'white')
    if (exclude) query = query.neq('product_id', exclude)

  } else {
    return NextResponse.json(null)
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) return NextResponse.json(null)

  return NextResponse.json(groupFirstProduct(data as Row[]))
}
