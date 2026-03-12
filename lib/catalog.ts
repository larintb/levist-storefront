import { unstable_cache } from 'next/cache'
import { getSupabase } from './supabase'
import type { FullInventoryRow, Product, CatalogFilters } from '@/types/product'

const VIEW = 'full_inventory_details'
const MIN_STOCK = 1 // stock > MIN_STOCK = disponible

// Fetch solo productos con stock (para home / featured)
async function fetchRows(filters: CatalogFilters = {}): Promise<FullInventoryRow[]> {
  const supabase = getSupabase()
  let query = supabase.from(VIEW).select('*').gt('stock', MIN_STOCK)

  if (filters.category)   query = query.eq('category', filters.category)
  if (filters.collection) query = query.eq('collection', filters.collection)
  if (filters.brand)      query = query.eq('brand', filters.brand)
  if (filters.color)      query = query.ilike('color', `%${filters.color}%`)
  if (filters.search)     query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)

  const { data, error } = await query.order('product_name')
  if (error) { console.error('Error fetching inventory:', error); return [] }
  return (data as FullInventoryRow[]) ?? []
}

// Fetch para catálogo: incluye variantes OOS del mismo producto
// Paso 1 — product_ids con stock, Paso 2 — todas las filas de esos productos
async function fetchRowsWithOOS(filters: CatalogFilters = {}): Promise<FullInventoryRow[]> {
  const supabase = getSupabase()

  // Paso 1: ids de productos que tienen al menos 1 variante con stock
  let stockQ = supabase.from(VIEW).select('product_id').gt('stock', MIN_STOCK)
  if (filters.category)   stockQ = stockQ.eq('category', filters.category)
  if (filters.collection) stockQ = stockQ.eq('collection', filters.collection)
  if (filters.brand)      stockQ = stockQ.eq('brand', filters.brand)
  if (filters.color)      stockQ = stockQ.ilike('color', `%${filters.color}%`)
  if (filters.search)     stockQ = stockQ.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)

  const { data: stockData } = await stockQ
  if (!stockData || stockData.length === 0) return []

  const productIds = [...new Set(stockData.map((r: { product_id: string }) => r.product_id))]

  // Paso 2: TODAS las filas de esos productos (con y sin stock)
  const { data, error } = await supabase
    .from(VIEW)
    .select('*')
    .in('product_id', productIds)
    .order('product_name')

  if (error) { console.error('Error fetching inventory with OOS:', error); return [] }
  return (data as FullInventoryRow[]) ?? []
}

const SIZE_ORDER = ['2XS','XXS','XS','S','M','L','XL','XXL','2XL','XXXL','3XL','4XL','5XL','6XL']

function sizeSort(a: string, b: string): number {
  const ai = SIZE_ORDER.indexOf(a.toUpperCase())
  const bi = SIZE_ORDER.indexOf(b.toUpperCase())
  if (ai !== -1 && bi !== -1) return ai - bi
  if (ai !== -1) return -1
  if (bi !== -1) return 1
  // Numeric fallback
  const an = parseFloat(a)
  const bn = parseFloat(b)
  if (!isNaN(an) && !isNaN(bn)) return an - bn
  return a.localeCompare(b)
}

function groupRows(rows: FullInventoryRow[]): Product[] {
  const productMap = new Map<string, Product>()
  // Deduplicate rows by inventory_id to prevent repeated sizes
  const seen = new Set<string>()

  for (const row of rows) {
    if (seen.has(row.inventory_id)) continue
    seen.add(row.inventory_id)

    // --- Product ---
    if (!productMap.has(row.product_id)) {
      productMap.set(row.product_id, {
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku,
        category: row.category,
        collection: row.collection,
        brand: row.brand,
        variants: [],
        min_price: row.price,
        max_price: row.price,
        primary_image: row.product_image,
      })
    }

    const product = productMap.get(row.product_id)!

    if (row.price < product.min_price) product.min_price = row.price
    if (row.price > product.max_price) product.max_price = row.price
    if (!product.primary_image && row.product_image) product.primary_image = row.product_image

    // --- Variant (grouped by color) ---
    const variantKey = `${row.product_id}|${row.color}`
    let variant = product.variants.find((v) => v.variant_key === variantKey)

    if (!variant) {
      variant = {
        variant_key: variantKey,
        color: row.color,
        image_url: row.product_image,
        sizes: [],
        in_stock: false,
      }
      product.variants.push(variant)
    }

    // Marcar variante como in_stock si alguna talla tiene stock suficiente
    if (row.stock > MIN_STOCK) variant.in_stock = true

    // --- Size ---
    const sizeExists = variant.sizes.some((s) => s.inventory_id === row.inventory_id)
    if (!sizeExists) {
      variant.sizes.push({
        inventory_id: row.inventory_id,
        size: row.size,
        stock: row.stock,
        price: row.price,
      })
    }
  }

  for (const product of productMap.values()) {
    for (const variant of product.variants) {
      variant.sizes.sort((a, b) => sizeSort(a.size, b.size))
    }
  }

  return Array.from(productMap.values())
}

export async function getCatalogProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  const rows = await fetchRowsWithOOS(filters)
  return groupRows(rows)
}

// Versión eficiente para home: solo trae los primeros N productos
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = getSupabase()

  // Paso 1: obtener los primeros N product_id únicos (query liviana)
  const { data: ids } = await supabase
    .from(VIEW)
    .select('product_id')
    .gt('stock', MIN_STOCK)
    .order('product_name')
    .limit(limit * 10) // margen para deduplicar

  if (!ids || ids.length === 0) return []

  const uniqueIds = [...new Set(ids.map((r: { product_id: string }) => r.product_id))].slice(0, limit)

  // Paso 2: traer solo las filas de esos productos
  const { data, error } = await supabase
    .from(VIEW)
    .select('*')
    .in('product_id', uniqueIds)
    .gt('stock', MIN_STOCK)

  if (error || !data) return []
  return groupRows(data as FullInventoryRow[])
}

export async function getProductById(productId: string): Promise<Product | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(VIEW)
    .select('*')
    .eq('product_id', productId)
    .order('color')

  if (error || !data || data.length === 0) return null

  const products = groupRows(data as FullInventoryRow[])
  return products[0] ?? null
}

export const getCategories = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from(VIEW).select('category').gt('stock', MIN_STOCK).not('category', 'is', null)
    if (!data) return []
    return [...new Set(data.map((r: { category: string }) => r.category).filter(Boolean))] as string[]
  },
  ['categories'],
  { revalidate: 600, tags: ['catalog'] }
)

export const getColors = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from(VIEW).select('color').gt('stock', MIN_STOCK).not('color', 'is', null)
    if (!data) return []
    return [...new Set(data.map((r: { color: string }) => r.color).filter(Boolean))] as string[]
  },
  ['colors'],
  { revalidate: 600, tags: ['catalog'] }
)

export interface ColorSwatch { color: string; image_url: string | null }

// Returns colors with the product image from a reference product (best-covered SKU)
// Falls back to any available image for that color if the reference product lacks one.
export const getColorSwatches = unstable_cache(
  async (referenceProductId = '6355'): Promise<ColorSwatch[]> => {
    const supabase = getSupabase()

    // Single query: all color+image pairs across the entire catalog (in-stock only)
    const [{ data: refData }, { data: allData }] = await Promise.all([
      supabase
        .from(VIEW)
        .select('color, product_image')
        .eq('product_id', referenceProductId)
        .not('product_image', 'is', null),
      supabase
        .from(VIEW)
        .select('color, product_image')
        .gt('stock', MIN_STOCK)
        .not('color', 'is', null),
    ])

    // Build reference map: color → image from the reference product
    const refMap = new Map<string, string>()
    for (const row of ((refData ?? []) as { color: string; product_image: string | null }[])) {
      const c = row.color.toLowerCase().trim()
      if (!refMap.has(c) && row.product_image) refMap.set(c, row.product_image)
    }

    type ColorRow = { color: string | null; product_image: string | null }
    const allRows = (allData ?? []) as ColorRow[]

    // Build fallback map: color → first image found anywhere in catalog
    const fallbackMap = new Map<string, string>()
    for (const row of allRows) {
      if (!row.product_image || !row.color) continue
      const c = row.color.toLowerCase().trim()
      if (!fallbackMap.has(c)) fallbackMap.set(c, row.product_image)
    }

    // Unique colors (preserving original casing)
    const seen = new Set<string>()
    const uniqueColors: string[] = []
    for (const row of allRows) {
      if (!row.color) continue
      const key = row.color.toLowerCase().trim()
      if (!seen.has(key)) { seen.add(key); uniqueColors.push(row.color) }
    }

    return uniqueColors.map((color) => {
      const key = color.toLowerCase().trim()
      return {
        color,
        image_url: refMap.get(key) ?? fallbackMap.get(key) ?? null,
      }
    })
  },
  ['color-swatches'],
  { revalidate: 600, tags: ['catalog'] }
)

export const getCollections = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from(VIEW).select('collection').gt('stock', MIN_STOCK).not('collection', 'is', null)
    if (!data) return []
    return [...new Set(data.map((r: { collection: string }) => r.collection).filter(Boolean))] as string[]
  },
  ['collections'],
  { revalidate: 600, tags: ['catalog'] }
)

export const getBrands = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from(VIEW).select('brand').gt('stock', MIN_STOCK).not('brand', 'is', null)
    if (!data) return []
    return [...new Set(data.map((r: { brand: string }) => r.brand).filter(Boolean))] as string[]
  },
  ['brands'],
  { revalidate: 600, tags: ['catalog'] }
)
