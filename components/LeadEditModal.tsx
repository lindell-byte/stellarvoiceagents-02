'use client'

import { CALL_STATUS_OPTIONS, type Lead } from '@/lib/leads-constants'

type LeadEditModalProps = {
  lead: Lead
  editForm: Record<string, string>
  updateEditField: (field: string, value: string) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
}

export function LeadEditModal({
  lead,
  editForm,
  updateEditField,
  onSave,
  onClose,
  saving,
}: LeadEditModalProps) {
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
                First Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                value={editForm['First Name']}
                onChange={(e) => updateEditField('First Name', e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Last Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                value={editForm['Last Name']}
                onChange={(e) => updateEditField('Last Name', e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-600">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              value={editForm['Email']}
              onChange={(e) => updateEditField('Email', e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Call Status
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                value={editForm['Call Status']}
                onChange={(e) =>
                  updateEditField('Call Status', e.target.value)
                }
              >
                <option value="">-- Select --</option>
                {CALL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
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
                  updateEditField('Campaign Date', e.target.value)
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
            onClick={onSave}
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
