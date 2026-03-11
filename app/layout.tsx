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
  title: {
    default: 'LEVIST Uniformes – Uniformes Médicos de Calidad',
    template: '%s | LEVIST Uniformes',
  },
  description:
    'Tienda oficial de LEVIST Uniformes. Encuentra uniformes médicos, scrubs y ropa clínica de alta calidad para profesionales de la salud.',
  keywords: ['uniformes médicos', 'scrubs', 'ropa clínica', 'uniforme enfermería', 'LEVIST'],
  openGraph: {
    title: 'LEVIST Uniformes – Uniformes Médicos de Calidad',
    description: 'Uniformes médicos de alta calidad para profesionales de la salud.',
    type: 'website',
    locale: 'es_MX',
    siteName: 'LEVIST Uniformes',
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
