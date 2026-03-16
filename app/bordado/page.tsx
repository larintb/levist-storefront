import type { Metadata } from 'next'
import BordadoForm from '@/components/BordadoForm'

export const metadata: Metadata = {
  title: 'Bordado Personalizado — LEVIST',
  description: 'Personaliza tu uniforme con bordado de nombre o logo. Elige lugar, color de hilo y diseño.',
}

export default function BordadoPage() {
  return <BordadoForm />
}
