'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Item {
  label: string
  href: string
  active: boolean
}

interface Props {
  title: string
  items: Item[]
  limit?: number
}

export default function CollapsibleFilterSection({ title, items, limit = 5 }: Props) {
  const hasMore = items.length > limit
  const activeIndex = items.findIndex((i) => i.active)
  // If active item is beyond the fold, start expanded
  const [expanded, setExpanded] = useState(activeIndex >= limit)

  const visible = expanded ? items : items.slice(0, limit)

  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{title}</p>
      <ul className="flex flex-col gap-1">
        {visible.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`block text-xs py-0.5 transition-colors ${
                item.active ? 'font-black text-black underline' : 'text-gray-500 hover:text-[#364458] font-bold'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#364458] transition-colors cursor-pointer"
        >
          {expanded ? 'Ver menos ↑' : `+${items.length - limit} más`}
        </button>
      )}
    </div>
  )
}
