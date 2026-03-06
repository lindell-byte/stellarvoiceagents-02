'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type DashboardSidebarProps = {
  className?: string
  onNavigate?: () => void
}

export function DashboardSidebar({ className = '', onNavigate }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href

  const handleNavClick = (href: string) => {
    if (onNavigate) onNavigate()
  }

  return (
    <aside
      className={`flex h-screen w-64 flex-col gap-4 bg-slate-950 px-4 py-5 text-white overflow-hidden ${className}`}
    >
      <div className="border-b border-slate-600/60 pb-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full shadow-[0_0_0_3px_rgba(37,99,235,0.3)] bg-[radial-gradient(circle_at_30%_20%,#38bdf8,#2563eb)]" />
          <div>
            <div className="text-sm font-semibold tracking-tight">Stellar Voice Agents</div>
            <div className="text-[11px] text-slate-400">Leads &amp; Enquiries</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/dashboard/leads"
          onClick={() => handleNavClick('/dashboard/leads')}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium no-underline transition-colors ${
            isActive('/dashboard/leads')
              ? 'bg-slate-900 text-white'
              : 'text-slate-200 hover:bg-slate-700/60 hover:text-white'
          }`}
        >
          <span className="text-base">&#128203;</span>
          <span>Leads List</span>
        </Link>
      </nav>

      <div className="mt-auto">
        <button
          className="w-full rounded-md border border-slate-500/70 bg-transparent px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:border-slate-200 hover:bg-slate-700/60 hover:text-white"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}

