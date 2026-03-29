import { unstable_cache } from 'next/cache'
import { getSupabase } from './supabase'
import type { FullInventoryRow, Product, CatalogFilters } from '@/types/product'

const VIEW = 'full_inventory_details'
const MIN_STOCK = 0 // stock > MIN_STOCK = disponible  (0 → incluye stock = 1)

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
  let stockQ = supabase.from(VIEW).select('product_id').gt('stock', MIN_STOCK).not('product_name', 'ilike', '%bata test%')
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
    .not('product_name', 'ilike', '%bata test%')
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

export function groupRows(rows: FullInventoryRow[]): Product[] {
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
    // Prefer an in-stock variant's image as the card cover photo
    const inStockImage = product.variants.find(v => v.in_stock && v.image_url)?.image_url
    if (inStockImage) product.primary_image = inStockImage
  }

  return Array.from(productMap.values())
}

const getCatalogProductsCached = unstable_cache(
  async (filters: Omit<CatalogFilters, 'sort'>): Promise<Product[]> => {
    const rows = await fetchRowsWithOOS(filters)
    return groupRows(rows)
  },
  ['catalog-products'],
  { revalidate: 600, tags: ['catalog'] }
)

export async function getCatalogProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  const { sort, ...rest } = filters
  const normalized = {
    category:   rest.category?.toLowerCase().trim(),
    color:      rest.color?.toLowerCase().trim(),
    collection: rest.collection?.toLowerCase().trim(),
    brand:      rest.brand?.toLowerCase().trim(),
    search:     rest.search?.toLowerCase().trim(),
  }
  const products = await getCatalogProductsCached(normalized)
  const sorted = [...products]
  switch (sort) {
    case 'name_desc': return sorted.sort((a, b) => b.product_name.localeCompare(a.product_name))
    case 'price_asc': return sorted.sort((a, b) => a.min_price - b.min_price)
    case 'price_desc': return sorted.sort((a, b) => b.min_price - a.min_price)
    default: return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name))
  }
}

// Versión eficiente para home: solo trae los primeros N productos
export const getFeaturedProducts = unstable_cache(
  async (limit = 8): Promise<Product[]> => {
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
  },
  ['featured-products'],
  { revalidate: 600, tags: ['catalog'] }
)

export const getProductById = unstable_cache(
  async (productId: string): Promise<Product | null> => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from(VIEW)
      .select('*')
      .eq('product_id', productId)
      .order('color')

    if (error || !data || data.length === 0) return null

    const products = groupRows(data as FullInventoryRow[])
    return products[0] ?? null
  },
  ['product-by-id'],
  { revalidate: 600, tags: ['catalog'] }
)

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

export interface ColorSwatch { color: string; image_url: string | null; in_stock: boolean }

export const getColorSwatches = unstable_cache(
  async (referenceProductId = 'b748c23b-711a-4652-9c15-82867f54bc66'): Promise<ColorSwatch[]> => {
    const supabase = getSupabase()

    const [{ data: refData }, { data: stockData }, { data: anyData }] = await Promise.all([
      // Reference product images (no stock filter — all colors)
      supabase
        .from(VIEW)
        .select('color, product_image')
        .eq('product_id', referenceProductId)
        .not('product_image', 'is', null),
      // Which colors have stock
      supabase
        .from(VIEW)
        .select('color')
        .gt('stock', MIN_STOCK)
        .not('color', 'is', null),
      // All colors with images, including OOS (for fallback)
      supabase
        .from(VIEW)
        .select('color, product_image')
        .not('color', 'is', null)
        .not('product_image', 'is', null),
    ])

    // refMap: color → image from reference product
    const refMap = new Map<string, string>()
    for (const row of ((refData ?? []) as { color: string; product_image: string | null }[])) {
      const c = row.color.toLowerCase().trim()
      if (!refMap.has(c) && row.product_image) refMap.set(c, row.product_image)
    }

    // inStockSet: colors that have at least one in-stock variant
    const inStockSet = new Set<string>()
    for (const row of ((stockData ?? []) as { color: string }[])) {
      inStockSet.add(row.color.toLowerCase().trim())
    }

    // fallbackMap: color → first image from any product (including OOS)
    type ColorRow = { color: string | null; product_image: string | null }
    const anyRows = (anyData ?? []) as ColorRow[]
    const fallbackMap = new Map<string, string>()
    for (const row of anyRows) {
      if (!row.product_image || !row.color) continue
      const c = row.color.toLowerCase().trim()
      if (!fallbackMap.has(c)) fallbackMap.set(c, row.product_image)
    }

    // Unique colors from all rows (preserving original casing)
    const seen = new Set<string>()
    const uniqueColors: string[] = []
    for (const row of anyRows) {
      if (!row.color) continue
      const key = row.color.toLowerCase().trim()
      if (!seen.has(key)) { seen.add(key); uniqueColors.push(row.color) }
    }

    return uniqueColors.map((color) => {
      const key = color.toLowerCase().trim()
      return {
        color,
        image_url: refMap.get(key) ?? fallbackMap.get(key) ?? null,
        in_stock: inStockSet.has(key),
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
