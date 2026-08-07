'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV = [
  { label: 'Preparation', href: '#preparation' },
  { label: 'Session', href: '#journey' },
  { label: 'Integration', href: '#integration' },
  { label: 'Safety', href: '#safety' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span aria-hidden="true" className="relative flex size-4 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-primary/70" />
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
            Bearings
          </span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex size-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border/60 bg-background md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-2">
            {NAV.map((item) => (
              <li key={item.href} className="border-b border-border/40 last:border-b-0">
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-[0.95rem] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
