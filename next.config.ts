import type { NextConfig } from 'next'

// Extraemos el hostname exacto de la URL de Supabase (ej: xyzabc.supabase.co)
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co'

const nextConfig: NextConfig = {
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
  images: {
    // Aquí autorizamos los dominios desde los cuales se cargarán las imágenes.
    remotePatterns: [
      // Supabase Storage — imágenes propias migradas
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
      // https://www.winkscrubs.com
      {
        protocol: 'https',
        hostname: 'winkscrubs.com', // Dominio que causa el error.
        port: '',
        pathname: '/**', // Puedes hacerlo más o menos específico.
      },
      // https://bacomade.com
      {
        protocol: 'https',
        hostname: 'barcomade.com',
        port: '',
        pathname: '/cdn/shop/files/**',
      },
      
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // https://via.placeholder.com
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      
      // https://images.barcodelookup.com
      {
        protocol: 'https',
        hostname: 'images.barcodelookup.com',
        port: '',
        pathname: '/**',
      },
      // https://scrubpro.com
      {
        protocol: 'https',
        hostname: 'scrubpro.com',
        port: '',
        pathname: '/**',
      },
      // https://m.media-amazon.com/images/I/31h27jjdyhL._SL500_.jpg
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/images/**',
      },
      // https://i.ebayimg.com/images/g/P6kAAOSwgDhlkh34/s-l1600.jpg
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
        port: '',
        pathname: '/images/**',
      },
      // https://cidone.cidresources.com/api/resources/5122-BLAC_0.jpg-c13f6259-ea32-48aa-8a63-f0bec8d762bc.jpg
      {
        protocol: 'https',
        hostname: 'cidone.cidresources.com',
        port: '',
        pathname: '/api/resources/**',
      },
      // https://mcgillsinc.com/cdn/shop/files/5354_BLAC.jpg?v=1747333550&width=1946
      {
        protocol: 'https',
        hostname: 'mcgillsinc.com',
        port: '',
        pathname: '/cdn/shop/files/**',
      },
      // https://products.mpowerpromo.com/SCRUB/CID5429/325871/cid5429/cid5429_blac.jpg
      {
        protocol: 'https',
        hostname: 'products.mpowerpromo.com',
        port: '',
        pathname: '/SCRUB/CID5429/**',
      },
      // https://scrub-supply.com/cdn/shop/files/P-WW6122-BLAC-Front2_180x.webp?v=1727542395
      {
        protocol: 'https',
        hostname: 'scrub-supply.com',
        port: '',
        pathname: '/cdn/shop/files/**',
      },
      // https://images.salsify.com/images/l2cjuddipf5kjifkdpi0/BOK80401XXS.jpg
      {
        protocol: 'https',
        hostname: 'images.salsify.com',
        port: '',
        pathname: '/images/**',
      },
      // https://adaruniforms.com/ftp_images/pro/model_images/4400/4400_hgr_t_part_fv.jpg
      {
        protocol: 'https',
        hostname: 'adaruniforms.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.adaruniforms.com',
        port: '',
        pathname: '/**',
      },
      // http://www.adaruniforms.com/ftp_images/universal/silhouettes/2801/2801_wht_sil_fv.jpg
      {
        protocol: 'http',
        hostname: 'www.adaruniforms.com',
        port: '',
        pathname: '/**',
      },
      // https://www.flexi.com.mx
      {
        protocol: 'https',
        hostname: 'www.flexi.com.mx',
        port: '',
        pathname: '/**',
      },
      // miplayera.com.mx
      {
        protocol: 'https',
        hostname: 'miplayera.com.mx',
        port: '',
        pathname: '/**',
      },
      // Puedes añadir más dominios aquí en el futuro.
      // Ejemplo:
      // {
      //   protocol: 'https',
      //   hostname: 'otro-dominio.com',
      // },
    ],
  },
}

export default nextConfig
