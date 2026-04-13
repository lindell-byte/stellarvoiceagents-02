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
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar – fixed/sticky, full height */}
      <div className="hidden md:block md:w-64 md:flex-shrink-0">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <DashboardSidebar />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-50 max-w-xs w-72">
            <DashboardSidebar
              className="h-full shadow-2xl"
              onNavigate={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content – scrolls independently */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar with menu button */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white shadow-sm md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border rounded-md shadow-sm border-slate-300 text-slate-700"
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

        {/* Scrollable content area */}
        <main className="flex-1 px-4 py-5 overflow-y-auto md:px-8 md:py-7">
          {children}
        </main>
      </div>
    </div>
  )
}