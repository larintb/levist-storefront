// Matches the actual columns returned by the full_inventory_details view
export interface FullInventoryRow {
  inventory_id: string
  product_id: string
  product_name: string
  sku: string | null
  color: string
  size: string
  stock: number
  price: number
  barcode: string | null
  is_available: boolean | null
  category: string | null
  collection: string | null
  brand: string | null
  product_image: string | null
}

export interface ProductSize {
  inventory_id: string
  size: string
  stock: number
  price: number
}

// A color group within a product
export interface ProductVariant {
  // synthetic key: product_id + '|' + color
  variant_key: string
  color: string
  image_url: string | null
  sizes: ProductSize[]
}

export interface Product {
  product_id: string
  product_name: string
  sku: string | null
  category: string | null
  collection: string | null
  brand: string | null
  variants: ProductVariant[]
  min_price: number
  max_price: number
  primary_image: string | null
}

export interface CartItem {
  product_id: string
  product_name: string
  variant_key: string
  inventory_id: string
  color: string
  size: string
  price: number
  quantity: number
  stock: number       // stock real al momento de agregar — límite máximo
  image_url: string | null
}

export interface CatalogFilters {
  category?: string
  color?: string
  collection?: string
  brand?: string
  search?: string
}
