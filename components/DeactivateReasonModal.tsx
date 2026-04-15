'use client'

import { useState } from 'react'
import { DEACTIVATION_REASONS } from '@/lib/leads-constants'

type DeactivateReasonModalProps = {
  isOpen: boolean
  isBulk?: boolean
  bulkCount?: number
  onConfirm: (reason: string) => void
  onCancel: () => void
  isLoading?: boolean
}

export function DeactivateReasonModal({
  isOpen,
  isBulk = false,
  bulkCount = 0,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeactivateReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const handleConfirm = () => {
    const reason = customReason.trim() || selectedReason
    if (!reason) {
      alert('Please select or enter a deactivation reason')
      return
    }
    onConfirm(reason)
    setSelectedReason('')
    setCustomReason('')
  }

  const handleCancel = () => {
    setSelectedReason('')
    setCustomReason('')
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isBulk ? `Deactivate ${bulkCount} Lead${bulkCount !== 1 ? 's' : ''}` : 'Deactivate Lead'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isBulk
              ? 'Select a reason for deactivating the selected leads.'
              : 'Select a reason for deactivating this lead.'}
          </p>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">
              Deactivation Reason
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select a predefined reason...</option>
              {Object.entries(DEACTIVATION_REASONS).map(([category, reasons]) => (
                <optgroup key={category} label={category}>
                  {reasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-600">
              Or Enter Custom Reason
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter a custom reason..."
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCancel}
            disabled={isLoading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}
