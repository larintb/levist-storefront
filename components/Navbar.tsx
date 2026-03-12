import { getCategories, getBrands, getCollections } from '@/lib/catalog'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const [categories, brands, collections] = await Promise.all([
    getCategories(),
    getBrands(),
    getCollections(),
  ])

  return (
    <NavbarClient
      categories={categories}
      brands={brands}
      collections={collections}
    />
  )
}
