import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import NewsletterPopup from '@/components/NewsletterPopup'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://levist.com'),
  title: {
    default: 'LEVIST Uniformes | Scrubs y Uniformes Médicos Personalizados',
    template: '%s | LEVIST Uniformes',
  },
  description:
    'La mejor calidad en scrubs, pijamas clínicas y batas con bordado personalizado. Uniformes médicos duraderos para profesionales de la salud.',
  keywords: [
    'scrubs', 'uniformes médicos', 'pijamas clínicas', 'filipinas médicas',
    'batas de laboratorio', 'bordado personalizado', 'ropa clínica', 'uniforme enfermería', 'LEVIST',
  ],
  openGraph: {
    title: 'LEVIST Uniformes – Calidad y Estilo para Profesionales',
    description: 'Equípate con los mejores scrubs y uniformes médicos. Diseñados para el confort y la durabilidad en el hospital.',
    type: 'website',
    locale: 'es_MX',
    siteName: 'LEVIST Uniformes',
    images: [
      {
        url: '/images/logo.jpg',
        alt: 'LEVIST Uniformes Médicos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LEVIST Uniformes – Calidad y Estilo para Profesionales',
    description: 'Scrubs, pijamas clínicas y uniformes médicos con bordado personalizado.',
    images: ['/images/logo.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-white text-gray-900 min-h-screen flex flex-col font-[family-name:var(--font-inter)]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <NewsletterPopup />
      </body>
    </html>
  )
}
