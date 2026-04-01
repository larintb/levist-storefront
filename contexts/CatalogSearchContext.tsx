'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface CatalogSearchContextValue {
  query: string
  setQuery: (q: string) => void
}

const CatalogSearchContext = createContext<CatalogSearchContextValue>({
  query: '',
  setQuery: () => {},
})

export function CatalogSearchProvider({
  children,
  initialQuery = '',
}: {
  children: React.ReactNode
  initialQuery?: string
}) {
  const [query, setQueryState] = useState(initialQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setQuery = useCallback((q: string) => {
    setQueryState(q)

    // Sync URL without triggering server navigation
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const url = new URL(window.location.href)
      if (q.trim()) {
        url.searchParams.set('q', q.trim())
      } else {
        url.searchParams.delete('q')
      }
      window.history.replaceState({}, '', url.toString())
    }, 300)
  }, [])

  return (
    <CatalogSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </CatalogSearchContext.Provider>
  )
}

export function useCatalogSearch() {
  return useContext(CatalogSearchContext)
}
