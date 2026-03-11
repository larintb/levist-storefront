import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductById, getCatalogProducts } from '@/lib/catalog'
import ProductGallery from '@/components/ProductGallery'
import VariantSelector from '@/components/VariantSelector'

export const revalidate = 300

interface PageProps {
  params: Promise<{ product: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product: productId } = await params
  const product = await getProductById(productId)
  if (!product) return { title: 'Producto no encontrado' }

  return {
    title: product.product_name,
    description: `${product.product_name}${product.brand ? ` – ${product.brand}` : ''}. Disponible en ${product.variants.length} color${product.variants.length > 1 ? 'es' : ''}.`,
    openGraph: {
      title: `${product.product_name} | LEVIST Uniformes`,
      description: `${product.category ?? 'Uniforme médico'} – ${product.brand ?? 'LEVIST Uniformes'}`,
      images: product.primary_image ? [{ url: product.primary_image }] : [],
    },
  }
}

export async function generateStaticParams() {
  const products = await getCatalogProducts()
  return products.map((p) => ({ product: p.product_id }))
}

export default async function ProductPage({ params }: PageProps) {
  const { product: productId } = await params
  const product = await getProductById(productId)
  if (!product) notFound()

  const fmt = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price)

  const priceLabel =
    product.min_price === product.max_price
      ? fmt(product.min_price)
      : `${fmt(product.min_price)} – ${fmt(product.max_price)}`

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 flex gap-2 flex-wrap">
        <a href="/" className="hover:text-black transition-colors">Inicio</a>
        <span>/</span>
        <a href="/catalogo" className="hover:text-black transition-colors">Catálogo</a>
        <span>/</span>
        <span className="text-black truncate">{product.product_name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <ProductGallery
          variants={product.variants}
          selectedVariantKey={product.variants[0]?.variant_key ?? ''}
        />

        {/* Info */}
        <div className="flex flex-col gap-6">
          {/* Marca / Categoría / Colección */}
          <div className="flex flex-wrap gap-2">
            {product.brand && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-400 px-2 py-1">
                {product.brand}
              </span>
            )}
            {product.category && (
              <span className="text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 text-gray-500">
                {product.category}
              </span>
            )}
            {product.collection && (
              <span className="text-[10px] font-black uppercase tracking-widest border border-gray-300 px-2 py-1 text-gray-500">
                {product.collection}
              </span>
            )}
          </div>

          {/* Nombre y precio */}
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-tight">
              {product.product_name}
            </h1>
            <p className="text-2xl font-bold text-gray-600 mt-2">{priceLabel}</p>
          </div>

          {/* Stats */}
          <div className="border-y border-gray-100 py-4 flex gap-6 text-[10px] uppercase tracking-widest font-bold text-gray-400">
            <span>
              <span className="text-black">{product.variants.length}</span>{' '}
              Color{product.variants.length > 1 ? 'es' : ''}
            </span>
            <span>
              <span className="text-black">
                {product.variants.reduce((s, v) => s + v.sizes.length, 0)}
              </span>{' '}
              Tallas
            </span>
            {product.sku && (
              <span>
                SKU <span className="text-black font-mono">{product.sku}</span>
              </span>
            )}
          </div>

          {/* Selector de variante */}
          <VariantSelector product={product} />
        </div>
      </div>
    </div>
  )
}
