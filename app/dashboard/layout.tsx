'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/DashboardSidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-50">
            <DashboardSidebar
              className="w-72 shadow-2xl"
              onNavigate={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <section className="flex-1 flex flex-col gap-5 px-4 py-5 md:px-8 md:py-7">
        {/* Mobile top bar with menu button */}
        <div className="mb-2 flex items-center justify-between md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
            onClick={() => setIsMobileOpen(true)}
          >
            <span className="inline-flex flex-col justify-between h-3">
              <span className="block h-0.5 w-4 bg-slate-700" />
              <span className="block h-0.5 w-4 bg-slate-700" />
              <span className="block h-0.5 w-4 bg-slate-700" />
            </span>
            <span>Menu</span>
          </button>
        </div>

        {children}
      </section>
    </div>
  )
}

