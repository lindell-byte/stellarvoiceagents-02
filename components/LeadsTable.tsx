'use client'

import { useState } from 'react'
import { type Lead, type SortDirection } from '@/lib/leads-constants'
import { LeadTagsCell } from '@/components/LeadTagsCell'
import { DeactivateReasonModal } from '@/components/DeactivateReasonModal'

type LeadsTableProps = {
  filteredLeads: Lead[]
  search: string
  sortDir: SortDirection
  setSortDir: (d: SortDirection) => void
  availableTags: string[]
  getSelectedTagsForLead: (lead: Lead) => string[]
  onToggleTag: (lead: Lead, tag: string) => void
  onCreateTag: (lead: Lead, tagName: string) => void
  onDeleteTag: (tagName: string) => void
  onEdit: (lead: Lead) => void
  selectedPhones: Set<string>
  visiblePhones: string[]
  allVisibleSelected: boolean
  bulkUpdating: boolean
  onTogglePhoneSelected: (phone: string) => void
  onToggleSelectAllVisible: () => void
  onClearSelection: () => void
  onBulkActivate: () => void
  onBulkDeactivate: (reason: string) => void
  onManualDeactivate: (phone: string, reason: string) => Promise<boolean>
  isLeadActive: (lead: Lead) => boolean
}

export function LeadsTable({
  filteredLeads,
  search,
  sortDir,
  setSortDir,
  availableTags,
  getSelectedTagsForLead,
  onToggleTag,
  onCreateTag,
  onDeleteTag,
  onEdit,
  selectedPhones,
  visiblePhones,
  allVisibleSelected,
  bulkUpdating,
  onTogglePhoneSelected,
  onToggleSelectAllVisible,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onManualDeactivate,
  isLeadActive,
}: LeadsTableProps) {
  const [deactivatingPhone, setDeactivatingPhone] = useState<string | null>(null)
  const [showDeactivateReasonModal, setShowDeactivateReasonModal] = useState(false)
  const [pendingDeactivationPhone, setPendingDeactivationPhone] = useState<string | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [showBulkDeactivateReasonModal, setShowBulkDeactivateReasonModal] = useState(false)

  const handleDeactivateClick = (phone: string) => {
    setPendingDeactivationPhone(phone)
    setShowDeactivateReasonModal(true)
  }

  const handleDeactivateConfirm = async (reason: string) => {
    if (!pendingDeactivationPhone) return
    setIsDeactivating(true)
    setDeactivatingPhone(pendingDeactivationPhone)

    try {
      await onManualDeactivate(pendingDeactivationPhone, reason)
    } finally {
      setIsDeactivating(false)
      setDeactivatingPhone(null)
      setShowDeactivateReasonModal(false)
      setPendingDeactivationPhone(null)
    }
  }

  const handleDeactivateCancel = () => {
    setShowDeactivateReasonModal(false)
    setPendingDeactivationPhone(null)
  }

  const handleBulkDeactivateClick = () => {
    setShowBulkDeactivateReasonModal(true)
  }

  const handleBulkDeactivateConfirm = (reason: string) => {
    onBulkDeactivate(reason)
    setShowBulkDeactivateReasonModal(false)
  }

  const handleBulkDeactivateCancel = () => {
    setShowBulkDeactivateReasonModal(false)
  }

  return (
    <>
      <DeactivateReasonModal
        isOpen={showDeactivateReasonModal}
        onConfirm={handleDeactivateConfirm}
        onCancel={handleDeactivateCancel}
        isLoading={isDeactivating}
      />
      <DeactivateReasonModal
        isOpen={showBulkDeactivateReasonModal}
        isBulk={true}
        bulkCount={selectedPhones.size}
        onConfirm={handleBulkDeactivateConfirm}
        onCancel={handleBulkDeactivateCancel}
        isLoading={bulkUpdating}
      />
      <div className="min-h-0 max-h-[calc(100vh-220px)] flex-1 overflow-auto rounded-xl bg-white shadow-xl shadow-slate-900/5">
      {selectedPhones.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-900">
            {selectedPhones.size} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onBulkActivate}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? 'Working...' : 'Activate'}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleBulkDeactivateClick}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? 'Working...' : 'Deactivate'}
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onClearSelection}
              disabled={bulkUpdating}
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-10 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600 bg-slate-50">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-blue-600"
                checked={allVisibleSelected}
                onChange={onToggleSelectAllVisible}
                disabled={visiblePhones.length === 0}
                title="Select all visible rows"
                aria-label="Select all visible rows"
              />
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              #
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Name
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Phone
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Email
            </th>
            <th
              className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase transition cursor-pointer bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-blue-600"
              onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
              title={`Sort by Campaign Date (${
                sortDir === 'desc' ? 'newest first' : 'oldest first'
              })`}
            >
              Campaign Date {sortDir === 'desc' ? '\u25BC' : '\u25B2'}
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Appointment Date
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Appointment Time
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Attempts
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Status
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Tags
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-left uppercase bg-slate-50 text-slate-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredLeads.length === 0 ? (
            <tr>
              <td
                colSpan={12}
                className="px-4 py-10 text-sm text-center text-slate-400"
              >
                {search ? 'No leads match your search' : 'No leads found'}
              </td>
            </tr>
          ) : (
            filteredLeads.map((lead, i) => {
              const active = isLeadActive(lead)
              const phone = String(lead['Phone Number'] || '').trim()
              const rowSelected = phone ? selectedPhones.has(phone) : false
              const selectedTags = getSelectedTagsForLead(lead)
              const rowKey =
                String(lead.id || '').trim() ||
                (phone ? `${phone}:${i}` : `lead-row-${i}`)
              return (
                <tr
                  key={rowKey}
                  className={`border-t border-slate-100 ${
                    active ? '' : 'opacity-60 hover:opacity-85'
                  } hover:bg-slate-50`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-blue-600"
                      checked={rowSelected}
                      onChange={() => onTogglePhoneSelected(phone)}
                      disabled={!phone}
                      aria-label="Select lead row"
                    />
                  </td>
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
                  <td className="px-4 py-2.5">
                    {lead['Appointment Date'] || '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    {lead['Appointment Time'] || '-'}
                  </td>
                  <td className="px-4 py-2.5">{lead['Attempts Count'] || '0'}</td>
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
                    onDeleteTag={onDeleteTag}
                  />
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        onClick={() => onEdit(lead)}
                        type="button"
                      >
                        Edit
                      </button>
                      {active && (
                        <button
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => handleDeactivateClick(phone)}
                          disabled={deactivatingPhone === phone || isDeactivating}
                          type="button"
                        >
                          {deactivatingPhone === phone ? 'Deactivating...' : 'Deactivate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
      </div>
    </>
  )
}