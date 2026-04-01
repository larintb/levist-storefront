import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductById, getCatalogProducts } from '@/lib/catalog'
import ProductPageClient from '@/components/ProductPageClient'

export const revalidate = 600

interface PageProps {
  params: Promise<{ product: string }>
  searchParams: Promise<{ color?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { product: productId } = await params
  const product = await getProductById(productId)
  if (!product) return { title: 'Producto no encontrado' }

  const colorCount = product.variants.length
  const description = `${product.product_name}${product.brand ? ` de ${product.brand}` : ''}. ${product.category ?? 'Uniforme médico'} disponible en ${colorCount} color${colorCount !== 1 ? 'es' : ''}. Bordado personalizado disponible.`

  return {
    title: product.product_name,
    description,
    openGraph: {
      title: `${product.product_name} | LEVIST Uniformes`,
      description,
      type: 'website',
      images: product.primary_image
        ? [{ url: product.primary_image, alt: product.product_name }]
        : [{ url: '/images/logo.jpg', alt: 'LEVIST Uniformes' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.product_name} | LEVIST Uniformes`,
      description,
      images: product.primary_image ? [product.primary_image] : ['/images/logo.jpg'],
    },
  }
}

export async function generateStaticParams() {
  const products = await getCatalogProducts()
  return products.map((p) => ({ product: p.product_id }))
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { product: productId } = await params
  const { color } = await searchParams
  const product = await getProductById(productId)
  if (!product) notFound()

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 flex gap-2 flex-wrap">
        <Link href="/" className="hover:text-[#364458] transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-[#364458] transition-colors">Catálogo</Link>
        <span>/</span>
        <span className="text-black truncate">{product.product_name}</span>
      </nav>

      <ProductPageClient
        product={product}
        initialColor={color}
        isBordado={product.product_name.toLowerCase().includes('bordado')}
      />
    </div>
  )
}
