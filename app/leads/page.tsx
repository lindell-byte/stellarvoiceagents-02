'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ========== WEBHOOK CONFIG (change per client) ==========
const N8N_GET_LEADS_URL = 'https://stan-n8n-u64462.vm.elestio.app/webhook/stellarvoiceagents-02-get-leads'
const N8N_UPDATE_LEAD_URL = 'https://stan-n8n-u64462.vm.elestio.app/webhook/stellarvoiceagents-02-update-lead'
// =========================================================

type Lead = Record<string, string>
type FilterType = 'all' | 'active' | 'inactive' | 'hot'

const CALL_SLOTS = ['Call #1', 'Call #2', 'Call #3', 'Call #4', 'Call #5', 'Call #6', 'Call #7', 'Call #8', 'Call #9']

const CALL_STATUS_OPTIONS = ['Scheduled', 'Immediate call', 'In Progress', 'Complete']

const isLeadActive = (lead: Lead): boolean => {
  const callStatus = String(lead['Call Status'] || '').toLowerCase().trim()
  const isComplete = callStatus === 'complete'
  const allCallsFilled = CALL_SLOTS.every(slot => String(lead[slot] || '').trim() !== '')
  return !isComplete && !allCallsFilled
}

const isHotLead = (lead: Lead): boolean => {
  const callStatus = String(lead['Call Status'] || '').toLowerCase().trim()
  const isComplete = callStatus === 'complete'
  const hasRecording = String(lead['Recordings link'] || '').trim() !== ''
  const callEvaluation = String(lead['Call Evaluation'] || '').toUpperCase().trim()
  const evalIsTrue = callEvaluation === 'TRUE'
  return isComplete && hasRecording && evalIsTrue
}

type SortDirection = 'asc' | 'desc'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [updatingPhone, setUpdatingPhone] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(N8N_GET_LEADS_URL, { mode: 'cors' })
      if (!res.ok) throw new Error(`Failed to fetch leads (${res.status})`)
      const data = await res.json()
      setLeads(Array.isArray(data.leads) ? data.leads : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Toggle Active/Inactive by updating Call Status
  const handleToggleStatus = async (lead: Lead) => {
    const phone = lead['Phone Number']
    if (!phone) return
    setUpdatingPhone(phone)

    const active = isLeadActive(lead)
    const newStatus = active ? 'Complete' : 'Scheduled'

    try {
      const res = await fetch(N8N_UPDATE_LEAD_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          updates: { 'Call Status': newStatus }
        })
      })
      if (!res.ok) throw new Error('Update failed')
      setLeads(prev => prev.map(l =>
        l['Phone Number'] === phone ? { ...l, 'Call Status': newStatus } : l
      ))
    } catch {
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingPhone(null)
    }
  }

  // Open edit modal
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setEditForm({
      'First Name': lead['First Name'] || '',
      'Last Name': lead['Last Name'] || '',
      'Email': lead['Email'] || '',
      'Call Status': lead['Call Status'] || '',
      'Campaign Date': lead['Campaign Date'] || '',
    })
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingLead) return
    const phone = editingLead['Phone Number']
    setSaving(true)

    try {
      const res = await fetch(N8N_UPDATE_LEAD_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          updates: editForm
        })
      })
      if (!res.ok) throw new Error('Save failed')
      setLeads(prev => prev.map(l =>
        l['Phone Number'] === phone ? { ...l, ...editForm } : l
      ))
      setEditingLead(null)
    } catch {
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateEditField = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // Parse a date string to a comparable value
  const parseDateValue = (dateStr: string | number): number => {
    const str = String(dateStr || '')
    if (!str.trim()) return 0
    const d = new Date(str.trim())
    return isNaN(d.getTime()) ? 0 : d.getTime()
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === 'hot') return isHotLead(lead)
    const active = isLeadActive(lead)
    if (filter === 'active' && !active) return false
    if (filter === 'inactive' && active) return false

    // Date filter
    if (dateFilter) {
      const leadDate = String(lead['Campaign Date'] || '').trim()
      if (!leadDate) return false
      const leadDateNorm = new Date(leadDate)
      const filterDateNorm = new Date(dateFilter)
      if (isNaN(leadDateNorm.getTime()) || leadDateNorm.toDateString() !== filterDateNorm.toDateString()) return false
    }

    if (search) {
      const q = search.toLowerCase()
      const name = `${String(lead['First Name'] || '')} ${String(lead['Last Name'] || '')}`.toLowerCase()
      const phone = String(lead['Phone Number'] || '').toLowerCase()
      const email = String(lead['Email'] || '').toLowerCase()
      return name.includes(q) || phone.includes(q) || email.includes(q)
    }

    return true
  }).sort((a, b) => {
    const dateA = parseDateValue(a['Campaign Date'] || '')
    const dateB = parseDateValue(b['Campaign Date'] || '')
    return sortDir === 'desc' ? dateB - dateA : dateA - dateB
  })

  const activeCount = leads.filter(isLeadActive).length
  const inactiveCount = leads.length - activeCount
  const hotLeads = leads.filter(isHotLead)

  return (
    <div className="leads-container">
      <Link href="/" className="btn-back">&larr; Back</Link>
      <div className="leads-header">
        <div>
          <h1>Leads / Enquiries</h1>
          <p className="subtitle">
            {loading ? 'Loading...' : `${leads.length} total leads`}
          </p>
        </div>
        <button className="btn-refresh" onClick={fetchLeads} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="leads-toolbar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All <span className="tab-count">{leads.length}</span>
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active <span className="tab-count">{activeCount}</span>
          </button>
          <button
            className={`filter-tab ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive <span className="tab-count">{inactiveCount}</span>
          </button>
          <button
            className={`filter-tab filter-tab-hot ${filter === 'hot' ? 'active' : ''}`}
            onClick={() => setFilter('hot')}
          >
            Hot Leads <span className="tab-count">{hotLeads.length}</span>
          </button>
        </div>
        <div className="toolbar-right">
          <div className="date-filter">
            <input
              type="date"
              className="date-filter-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by Campaign Date"
            />
            {dateFilter && (
              <button
                className="date-filter-clear"
                onClick={() => setDateFilter('')}
                title="Clear date filter"
              >
                &times;
              </button>
            )}
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="status error">{error}</div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading leads...</p>
        </div>
      )}

      {!loading && !error && (
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th
                  className="sortable-th"
                  onClick={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title={`Sort by Campaign Date (${sortDir === 'desc' ? 'newest first' : 'oldest first'})`}
                >
                  Campaign Date {sortDir === 'desc' ? '\u25BC' : '\u25B2'}
                </th>
                <th>Calls</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-row">
                    {search ? 'No leads match your search' : 'No leads found'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, i) => {
                  const active = isLeadActive(lead)
                  const callsUsed = CALL_SLOTS.filter(slot => (lead[slot] || '').trim() !== '').length
                  const isUpdating = updatingPhone === lead['Phone Number']
                  return (
                    <tr key={i} className={active ? '' : 'row-inactive'}>
                      <td>{i + 1}</td>
                      <td className="name-cell">
                        {`${lead['First Name'] || ''} ${lead['Last Name'] || ''}`.trim() || '-'}
                      </td>
                      <td>{lead['Phone Number'] || '-'}</td>
                      <td className="email-cell">{lead['Email'] || '-'}</td>
                      <td>{lead['Campaign Date'] || '-'}</td>
                      <td>{callsUsed}/9</td>
                      <td>
                        <span className={`status-badge ${active ? 'badge-active' : 'badge-inactive'}`}>
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className={`btn-action ${active ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => handleToggleStatus(lead)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? '...' : active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEdit(lead)}
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
      )}

      {/* Edit Modal */}
      {editingLead && (
        <div className="modal-overlay" onClick={() => !saving && setEditingLead(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Lead</h2>
              <button
                className="modal-close"
                onClick={() => !saving && setEditingLead(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingLead['Phone Number'] || ''}
                  disabled
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm['First Name']}
                    onChange={(e) => updateEditField('First Name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm['Last Name']}
                    onChange={(e) => updateEditField('Last Name', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm['Email']}
                  onChange={(e) => updateEditField('Email', e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Call Status</label>
                  <select
                    className="form-input"
                    value={editForm['Call Status']}
                    onChange={(e) => updateEditField('Call Status', e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {CALL_STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Campaign Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm['Campaign Date']}
                    onChange={(e) => updateEditField('Campaign Date', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setEditingLead(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
