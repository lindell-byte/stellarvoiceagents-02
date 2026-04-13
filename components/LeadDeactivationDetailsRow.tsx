'use client'

import { useState } from 'react'
import { type Lead } from '@/lib/leads-constants'

type LeadDeactivationDetailsRowProps = {
  lead: Lead
  isExpanded: boolean
  onToggleExpand: () => void
  onSaveDetails: (details: string) => Promise<void>
  isSaving: boolean
}

export function LeadDeactivationDetailsRow({
  lead,
  isExpanded,
  onToggleExpand,
  onSaveDetails,
  isSaving,
}: LeadDeactivationDetailsRowProps) {
  const [editMode, setEditMode] = useState(false)
  const [details, setDetails] = useState(lead['Deactivation Details'] || '')
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!details.trim()) {
      setError('Deactivation details cannot be empty')
      return
    }
    try {
      await onSaveDetails(details)
      setEditMode(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleCancel = () => {
    setDetails(lead['Deactivation Details'] || '')
    setEditMode(false)
    setError('')
  }

  const callStatus = String(lead['Call Status'] || '').toLowerCase().trim()
  const isDeactivated = callStatus === 'deactivated' || callStatus === 'complete'

  if (!isDeactivated && !details) {
    return null
  }

  return (
    <>
      <tr className="border-t border-slate-100">
        <td colSpan={10} className="px-0 py-0">
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition flex items-center gap-2"
          >
            <span className={`inline-flex transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-medium text-slate-700">
              {isExpanded ? 'Hide' : 'Show'} Deactivation Details
            </span>
            {details && (
              <span className="ml-auto text-xs text-slate-500 truncate max-w-sm">
                {details}
              </span>
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-t border-slate-200 bg-slate-50">
          <td colSpan={10} className="px-6 py-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Deactivation Details
                </label>
                {!editMode ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-3">
                        {details || '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 whitespace-nowrap"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
                      rows={4}
                      value={details}
                      onChange={(e) => {
                        setDetails(e.target.value)
                        setError('')
                      }}
                      placeholder="Enter reason for deactivation..."
                    />
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
