import { getSupabase } from './supabase'
import type { FullInventoryRow, Product, ProductVariant, CatalogFilters } from '@/types/product'

const VIEW = 'full_inventory_details'
const MIN_STOCK = 1 // show only stock > 1

async function fetchRows(filters: CatalogFilters = {}): Promise<FullInventoryRow[]> {
  const supabase = getSupabase()
  let query = supabase.from(VIEW).select('*').gt('stock', MIN_STOCK)

  if (filters.category)   query = query.eq('category', filters.category)
  if (filters.collection) query = query.eq('collection', filters.collection)
  if (filters.brand)      query = query.eq('brand', filters.brand)
  if (filters.color)      query = query.ilike('color', `%${filters.color}%`)
  if (filters.search)     query = query.ilike('product_name', `%${filters.search}%`)

  const { data, error } = await query.order('product_name')

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }
  return (data as FullInventoryRow[]) ?? []
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
      }
      product.variants.push(variant)
    }

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

  return Array.from(productMap.values())
}

export async function getCatalogProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  const rows = await fetchRows(filters)
  return groupRows(rows)
}

export async function getProductById(productId: string): Promise<Product | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(VIEW)
    .select('*')
    .eq('product_id', productId)
    .gt('stock', MIN_STOCK)

  if (error || !data || data.length === 0) return null

  const products = groupRows(data as FullInventoryRow[])
  return products[0] ?? null
}

export async function getCategories(): Promise<string[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from(VIEW).select('category').gt('stock', MIN_STOCK).not('category', 'is', null)
  if (!data) return []
  return [...new Set(data.map((r: { category: string }) => r.category).filter(Boolean))] as string[]
}

export async function getColors(): Promise<string[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from(VIEW).select('color').gt('stock', MIN_STOCK).not('color', 'is', null)
  if (!data) return []
  return [...new Set(data.map((r: { color: string }) => r.color).filter(Boolean))] as string[]
}

export async function getCollections(): Promise<string[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from(VIEW).select('collection').gt('stock', MIN_STOCK).not('collection', 'is', null)
  if (!data) return []
  return [...new Set(data.map((r: { collection: string }) => r.collection).filter(Boolean))] as string[]
}

export async function getBrands(): Promise<string[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from(VIEW).select('brand').gt('stock', MIN_STOCK).not('brand', 'is', null)
  if (!data) return []
  return [...new Set(data.map((r: { brand: string }) => r.brand).filter(Boolean))] as string[]
}
