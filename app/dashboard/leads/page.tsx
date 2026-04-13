'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { useTags } from '@/hooks/useTags'
import { LeadsToolbar } from '@/components/LeadsToolbar'
import { LeadsTable } from '@/components/LeadsTable'
import { LeadEditModal } from '@/components/LeadEditModal'
import { UploadLeadsModal } from '@/components/UploadLeadsModal'

export default function DashboardLeadsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)

  const {
    availableTagNames,
    getSelectedTagsForLead,
    onToggleTag,
    onCreateTag,
    deleteTag,
  } = useTags()

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
    editingLead,
    setEditingLead,
    editForm,
    handleEdit,
    handleSaveEdit,
    updateEditField,
    saving,
    selectedPhones,
    visiblePhones,
    allVisibleSelected,
    bulkUpdating,
    togglePhoneSelected,
    toggleSelectAllVisible,
    clearSelection,
    handleBulkActivate,
    handleBulkDeactivate,
    handleManualDeactivate,
    isLeadActive,
    isAdmin,
    allClients,
    selectedAdminClientId,
    setSelectedAdminClientId,
  } = useLeads()

  return (
    <div className="flex flex-col w-full h-full space-y-5">
      {isAdmin && (
        <div className="flex items-center gap-4 p-4 border bg-amber-50 border-amber-200 rounded-xl">
          <label className="text-sm font-semibold text-amber-800 whitespace-nowrap">
            Admin — Viewing client:
          </label>
          <select
            className="flex-1 px-3 py-2 text-sm bg-white border rounded-lg border-amber-300 focus:border-blue-500"
            value={selectedAdminClientId ?? ''}
            onChange={e => setSelectedAdminClientId(e.target.value || null)}
          >
            <option value="">-- Select a client --</option>
            {allClients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name ?? '(no name)'} — {c.email}
              </option>
            ))}
          </select>
        </div>
      )}
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
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50"
            onClick={() => setShowUploadModal(true)}
            type="button"
          >
            Upload Leads
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
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
        <div className="px-4 py-3 mt-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 px-6 bg-white shadow rounded-xl py-14 text-slate-500">
          <div className="border-2 rounded-full h-9 w-9 animate-spin border-slate-200 border-t-blue-500" />
          <p className="text-sm">Loading leads...</p>
        </div>
      )}

      {!loading && !error && (
        <LeadsTable
          filteredLeads={filteredLeads}
          search={search}
          sortDir={sortDir}
          setSortDir={setSortDir}
          availableTags={availableTagNames}
          getSelectedTagsForLead={getSelectedTagsForLead}
          onToggleTag={onToggleTag}
          onCreateTag={onCreateTag}
          onDeleteTag={deleteTag}
          onEdit={handleEdit}
          selectedPhones={selectedPhones}
          visiblePhones={visiblePhones}
          allVisibleSelected={allVisibleSelected}
          bulkUpdating={bulkUpdating}
          onTogglePhoneSelected={togglePhoneSelected}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          onClearSelection={clearSelection}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onManualDeactivate={handleManualDeactivate}
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
