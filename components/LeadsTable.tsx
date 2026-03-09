'use client'

import { CALL_SLOTS, type Lead, type SortDirection } from '@/lib/leads-constants'
import { LeadTagsCell } from '@/components/LeadTagsCell'

type LeadsTableProps = {
  filteredLeads: Lead[]
  search: string
  sortDir: SortDirection
  setSortDir: (d: SortDirection) => void
  availableTags: string[]
  tagsByLead: Record<string, string[]>
  onToggleTag: (lead: Lead, tag: string) => void
  onCreateTag: (lead: Lead, tagName: string) => void
  onToggleStatus: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  updatingPhone: string | null
  isLeadActive: (lead: Lead) => boolean
}

export function LeadsTable({
  filteredLeads,
  search,
  sortDir,
  setSortDir,
  availableTags,
  tagsByLead,
  onToggleTag,
  onCreateTag,
  onToggleStatus,
  onEdit,
  updatingPhone,
  isLeadActive,
}: LeadsTableProps) {
  return (
    <div className="min-h-0 max-h-[calc(100vh-220px)] flex-1 overflow-auto rounded-xl bg-white shadow-xl shadow-slate-900/5">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              #
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Name
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Phone
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Email
            </th>
            <th
              className="cursor-pointer bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-indigo-50 hover:text-blue-600"
              onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              title={`Sort by Campaign Date (${
                sortDir === 'desc' ? 'newest first' : 'oldest first'
              })`}
            >
              Campaign Date {sortDir === 'desc' ? '\u25BC' : '\u25B2'}
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Calls
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Status
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Tags
            </th>
            <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredLeads.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-4 py-10 text-center text-sm text-slate-400"
              >
                {search ? 'No leads match your search' : 'No leads found'}
              </td>
            </tr>
          ) : (
            filteredLeads.map((lead, i) => {
              const active = isLeadActive(lead)
              const callsUsed = CALL_SLOTS.filter(
                (slot) => (lead[slot] || '').trim() !== ''
              ).length
              const isUpdating = updatingPhone === lead['Phone Number']
              const phone = lead['Phone Number'] ?? ''
              const selectedTags = tagsByLead[phone] ?? []
              return (
                <tr
                  key={i}
                  className={`border-t border-slate-100 ${
                    active ? '' : 'opacity-60 hover:opacity-85'
                  } hover:bg-slate-50`}
                >
                  <td className="px-4 py-2.5">{i + 1}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">
                    {`${lead['First Name'] || ''} ${lead['Last Name'] || ''}`.trim() ||
                      '-'}
                  </td>
                  <td className="px-4 py-2.5">{lead['Phone Number'] || '-'}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-slate-700">
                    {lead['Email'] || '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    {lead['Campaign Date'] || '-'}
                  </td>
                  <td className="px-4 py-2.5">{callsUsed}/9</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        active
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border border-slate-300 bg-slate-100 text-slate-700'
                      }`}
                    >
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <LeadTagsCell
                    lead={lead}
                    availableTags={availableTags}
                    selectedTags={selectedTags}
                    onToggleTag={onToggleTag}
                    onCreateTag={onCreateTag}
                  />
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <button
                      className={`mr-2 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      onClick={() => onToggleStatus(lead)}
                      disabled={isUpdating}
                      type="button"
                    >
                      {isUpdating ? '...' : active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      onClick={() => onEdit(lead)}
                      type="button"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
