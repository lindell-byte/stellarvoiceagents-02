'use client'

import { useState, useCallback } from 'react'
import { TAGS_DEFAULT } from '@/lib/leads-constants'
import type { Lead } from '@/lib/leads-constants'
import { useLeads } from '@/hooks/useLeads'
import { LeadsToolbar } from '@/components/LeadsToolbar'
import { LeadsTable } from '@/components/LeadsTable'
import { LeadEditModal } from '@/components/LeadEditModal'
import { UploadLeadsModal } from '@/components/UploadLeadsModal'

export default function DashboardLeadsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  // TODO(DB): Fetch availableTags from DB on mount; replace TAGS_DEFAULT with API response.
  const [availableTags, setAvailableTags] = useState<string[]>(TAGS_DEFAULT)
  // TODO(DB): Fetch tagsByLead (lead id -> tag[]) from DB on mount; persist on toggle/create below.
  const [tagsByLead, setTagsByLead] = useState<Record<string, string[]>>({})

  // TODO(DB): Persist add/remove tag to DB when user toggles tag on a lead.
  const onToggleTag = useCallback((lead: Lead, tag: string) => {
    const phone = lead['Phone Number'] ?? ''
    setTagsByLead((prev) => {
      const current = prev[phone] ?? []
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
      return { ...prev, [phone]: next }
    })
  }, [])

  // TODO(DB): POST new tag to DB when user creates a tag; persist assignment to lead.
  const onCreateTag = useCallback((lead: Lead, tagName: string) => {
    const trimmed = tagName.trim()
    if (!trimmed) return
    const phone = lead['Phone Number'] ?? ''
    setAvailableTags((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    )
    setTagsByLead((prev) => {
      const current = prev[phone] ?? []
      if (current.includes(trimmed)) return prev
      return { ...prev, [phone]: [...current, trimmed] }
    })
  }, [])

  const {
    leads,
    loading,
    error,
    fetchLeads,
    filter,
    setFilter,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    sortDir,
    setSortDir,
    filteredLeads,
    activeCount,
    inactiveCount,
    hotLeads,
    handleToggleStatus,
    editingLead,
    setEditingLead,
    editForm,
    handleEdit,
    handleSaveEdit,
    updateEditField,
    saving,
    updatingPhone,
    isLeadActive,
  } = useLeads()

  return (
    <div className="flex h-full w-full max-w-6xl flex-col space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Leads / Enquiries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Loading...' : `${leads.length} total leads`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50"
            onClick={() => setShowUploadModal(true)}
            type="button"
          >
            Upload Leads
          </button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={fetchLeads}
            disabled={loading}
            type="button"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <LeadsToolbar
        filter={filter}
        setFilter={setFilter}
        leadsLength={leads.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        hotLeadsLength={hotLeads.length}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        search={search}
        setSearch={setSearch}
      />

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white px-6 py-14 text-slate-500 shadow">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          <p className="text-sm">Loading leads...</p>
        </div>
      )}

      {!loading && !error && (
        <LeadsTable
          filteredLeads={filteredLeads}
          search={search}
          sortDir={sortDir}
          setSortDir={setSortDir}
          availableTags={availableTags}
          tagsByLead={tagsByLead}
          onToggleTag={onToggleTag}
          onCreateTag={onCreateTag}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          updatingPhone={updatingPhone}
          isLeadActive={isLeadActive}
        />
      )}

      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          editForm={editForm}
          updateEditField={updateEditField}
          onSave={handleSaveEdit}
          onClose={() => setEditingLead(null)}
          saving={saving}
        />
      )}

      {showUploadModal && (
        <UploadLeadsModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchLeads}
        />
      )}
    </div>
  )
}
