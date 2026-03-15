'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type FilterItem = {
  label: string
  href: string
  active?: boolean
}

interface CollapsibleFilterSectionProps {
  title: string
  items: FilterItem[]
}

export default function CollapsibleFilterSection({
  title,
  items,
}: CollapsibleFilterSectionProps) {
  const hasActiveItem = useMemo(() => items.some((item) => item.active), [items])
  const [open, setOpen] = useState(hasActiveItem)

  return (
    <section className="border-b border-gray-100 pb-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-1 text-left"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {title}
        </span>

        <svg
          className={`h-4 w-4 text-[#364458] transition-transform duration-300 ease-out ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={`grid overflow-hidden transition-[opacity,margin] duration-300 ease-out ${
          open ? 'opacity-100 mt-3' : 'opacity-0 mt-0'
        }`}
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 300ms ease-out, opacity 300ms ease-out, margin 300ms ease-out',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-2 pb-1">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs uppercase tracking-wide transition-all duration-200 ${
                  item.active
                    ? 'font-black text-[#364458]'
                    : 'font-medium text-gray-500 hover:text-[#364458] hover:translate-x-1'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
