import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage sirve las imágenes directamente desde su CDN.
    // unoptimized: true elimina sharp del proceso de Node.js en Render (512 MB),
    // que era la causa principal de los crashes por OOM.
    // Si se necesita optimización en el futuro, usar la API de transformación de
    // Supabase (/storage/v1/render/image/) con un custom loader.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=1200',
          },
        ],
      },
      {
        source: '/catalogo',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=1200',
          },
        ],
      },
      {
        source: '/catalogo/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1200, stale-while-revalidate=2400',
          },
        ],
      },
    ]
  },
}

export default nextConfig
