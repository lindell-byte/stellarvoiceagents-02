'use client'

import { useEffect, useState } from 'react'
import type { Lead } from '@/lib/leads-constants'
import type { CallActivity, TextActivity } from '@/app/api/lead-activity/route'

type AttemptsModalProps = {
  lead: Lead
  onClose: () => void
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return ''
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export function AttemptsModal({ lead, onClose }: AttemptsModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [calls, setCalls] = useState<CallActivity[]>([])
  const [texts, setTexts] = useState<TextActivity[]>([])

  const leadId = String(lead.id || '').trim()
  const name = `${lead['First Name'] || ''} ${lead['Last Name'] || ''}`.trim() || 'Lead'

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!leadId) {
        setError('This lead has no id, so its activity cannot be loaded.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/lead-activity?lead_id=${encodeURIComponent(leadId)}`)
        if (!res.ok) throw new Error(`Failed to load activity (${res.status})`)
        const data = await res.json()
        if (cancelled) return
        setCalls(Array.isArray(data.calls) ? data.calls : [])
        setTexts(Array.isArray(data.texts) ? data.texts : [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [leadId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Attempt history</h2>
            <p className="mt-1 text-sm text-slate-600">
              {name} {lead['Phone Number'] ? `· ${lead['Phone Number']}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            {calls.length} {calls.length === 1 ? 'call' : 'calls'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
            {texts.length} {texts.length === 1 ? 'text' : 'texts'}
          </span>
          <span className="ml-auto text-xs text-slate-400">
            Attempts recorded: {lead['Attempts Count'] || '0'}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
              <p className="text-sm">Loading activity...</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && calls.length === 0 && texts.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              No calls or texts recorded for this lead yet.
            </p>
          )}

          {!loading && !error && (calls.length > 0 || texts.length > 0) && (
            <div className="space-y-6">
              {calls.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Calls
                  </h3>
                  <ul className="space-y-2">
                    {calls.map((c, i) => (
                      <li
                        key={c.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            Call #{i + 1}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDateTime(c.timestamp)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          {c.ended_reason && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-700">
                              {c.ended_reason}
                            </span>
                          )}
                          {c.call_duration_seconds != null && (
                            <span>{formatDuration(c.call_duration_seconds)}</span>
                          )}
                          {c.recording_url && (
                            <a
                              href={c.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:underline"
                            >
                              Recording
                            </a>
                          )}
                        </div>
                        {(c.summary || c.call_outcome) && (
                          <p className="mt-1.5 text-xs text-slate-600">
                            {c.summary || c.call_outcome}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {texts.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Texts
                  </h3>
                  <ul className="space-y-2">
                    {texts.map((t, i) => (
                      <li
                        key={t.id}
                        className="rounded-lg border border-slate-200 bg-violet-50/40 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            Text #{i + 1}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDateTime(t.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          {t.status && (
                            <span className="rounded bg-violet-200 px-1.5 py-0.5 text-violet-800">
                              {t.status}
                            </span>
                          )}
                          {t.phone_number_to && <span>to {t.phone_number_to}</span>}
                        </div>
                        {t.message_body && (
                          <p className="mt-1.5 text-xs text-slate-700">{t.message_body}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
