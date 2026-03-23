'use client'

import type { FilterType } from '@/lib/leads-constants'

type LeadsToolbarProps = {
  filter: FilterType
  setFilter: (f: FilterType) => void
  leadsLength: number
  activeCount: number
  inactiveCount: number
  hotLeadsLength: number
  dateFilter: string
  setDateFilter: (d: string) => void
  search: string
  setSearch: (s: string) => void
}

export function LeadsToolbar({
  filter,
  setFilter,
  leadsLength,
  activeCount,
  inactiveCount,
  hotLeadsLength,
  dateFilter,
  setDateFilter,
  search,
  setSearch,
}: LeadsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          className={`flex items-center gap-2 border-r border-slate-200 px-4 py-2 text-sm font-medium transition last:border-r-0 ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setFilter('all')}
        >
          All
          <span
            className={`rounded-full px-2 text-[11px] font-semibold ${
              filter === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {leadsLength}
          </span>
        </button>
        <button
          className={`flex items-center gap-2 border-r border-slate-200 px-4 py-2 text-sm font-medium transition last:border-r-0 ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setFilter('active')}
        >
          Active
          <span
            className={`rounded-full px-2 text-[11px] font-semibold ${
              filter === 'active'
                ? 'bg-white/25 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeCount}
          </span>
        </button>
        <button
          className={`flex items-center gap-2 border-r border-slate-200 px-4 py-2 text-sm font-medium transition last:border-r-0 ${
            filter === 'inactive'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setFilter('inactive')}
        >
          Inactive
          <span
            className={`rounded-full px-2 text-[11px] font-semibold ${
              filter === 'inactive'
                ? 'bg-white/25 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {inactiveCount}
          </span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            filter === 'hot'
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-600 hover:bg-red-50'
          }`}
          onClick={() => setFilter('hot')}
        >
          Hot Leads
          <span
            className={`rounded-full px-2 text-[11px] font-semibold ${
              filter === 'hot' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-700'
            }`}
          >
            {hotLeadsLength}
          </span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <input
            type="date"
            className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter by Campaign Date"
          />
          {dateFilter && (
            <button
              className="absolute right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-700 transition hover:bg-slate-300"
              onClick={() => setDateFilter('')}
              title="Clear date filter"
              type="button"
            >
              &times;
            </button>
          )}
        </div>
        <input
          type="text"
          className="min-w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  )
}
