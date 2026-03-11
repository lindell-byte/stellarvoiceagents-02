'use client'

import { useState, useCallback } from 'react'
import { CALL_STATUS_OPTIONS, type Lead } from '@/lib/leads-constants'

// TODO(DB): When tags are persisted, optionally add Tags field to this form and sync with DB on save.

const REQUIRED_FIELDS = [
  'First Name',
  'Last Name',
  'Email',
  'Call Status',
] as const

function getValidationErrors(form: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of REQUIRED_FIELDS) {
    const value = (form[field] ?? '').trim()
    if (!value) {
      errors[field] = 'Required'
    }
  }
  if (form['Email']?.trim()) {
    const email = form['Email'].trim()
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailValid) errors['Email'] = 'Enter a valid email address'
  }
  return errors
}

type LeadEditModalProps = {
  lead: Lead
  editForm: Record<string, string>
  statusOptions?: string[]
  updateEditField: (field: string, value: string) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
}

export function LeadEditModal({
  lead,
  editForm,
  statusOptions = CALL_STATUS_OPTIONS,
  updateEditField,
  onSave,
  onClose,
  saving,
}: LeadEditModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSave = useCallback(() => {
    const nextErrors = getValidationErrors(editForm)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSave()
  }, [editForm, onSave])

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      updateEditField(field, value)
      setErrors((prev) => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    [updateEditField]
  )

  const hasError = (field: string) => !!errors[field]
  const inputErrorClass = (field: string) =>
    hasError(field)
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/10'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 py-5"
      onClick={() => !saving && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2>Edit Lead</h2>
          <button
            className="text-2xl leading-none text-slate-400 hover:text-slate-700"
            onClick={() => !saving && onClose()}
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-600">
              Phone Number
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              value={lead['Phone Number'] || ''}
              disabled
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 ${inputErrorClass('First Name')}`}
                value={editForm['First Name']}
                onChange={(e) => handleFieldChange('First Name', e.target.value)}
              />
              {hasError('First Name') && (
                <p className="text-xs text-red-600">{errors['First Name']}</p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 ${inputErrorClass('Last Name')}`}
                value={editForm['Last Name']}
                onChange={(e) => handleFieldChange('Last Name', e.target.value)}
              />
              {hasError('Last Name') && (
                <p className="text-xs text-red-600">{errors['Last Name']}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-600">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 ${inputErrorClass('Email')}`}
              value={editForm['Email']}
              onChange={(e) => handleFieldChange('Email', e.target.value)}
            />
            {hasError('Email') && (
              <p className="text-xs text-red-600">{errors['Email']}</p>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Call Status <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 ${inputErrorClass('Call Status')}`}
                value={editForm['Call Status']}
                onChange={(e) =>
                  handleFieldChange('Call Status', e.target.value)
                }
              >
                <option value="">-- Select --</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {hasError('Call Status') && (
                <p className="text-xs text-red-600">{errors['Call Status']}</p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Campaign Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                value={editForm['Campaign Date']}
                onChange={(e) =>
                  handleFieldChange('Campaign Date', e.target.value)
                }
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={saving}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
