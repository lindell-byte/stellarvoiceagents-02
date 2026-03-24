'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClientProfile = {
  id: string
  created_at: string
  name: string | null
  email: string | null
  timezone: string | null
  vapi_assistant_id: string | null
  country_code: string | null
  campaign_settings: any | null
}

type StatusType = 'success' | 'error' | 'loading' | null

// ────────────────────────────────────────────────
// Campaign Day shape (UI-friendly)
type CampaignDay = {
  day_offset: number          // 0 = Day 1, 1 = Day 2, ...
  action: 'none' | 'call' | 'sms'
  times: string[]             // e.g. ["08:00", "12:00"]
}

// Available time slots (customize as needed)
const availableTimes = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
]

/** SMS days in schedule order → sms_1, sms_2, … (by day_offset). */
function smsDaysInOrder(days: CampaignDay[]): CampaignDay[] {
  return [...days]
    .filter(d => d.action === 'sms' && d.times.length > 0)
    .sort((a, b) => a.day_offset - b.day_offset)
}

export default function SettingsPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [form, setForm] = useState({
    name: '',
    timezone: '',
    vapi_assistant_id: '',
    country_code: '',
  })
  const [days, setDays] = useState<CampaignDay[]>([])
  const [smsTemplates, setSmsTemplates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({
    message: '',
    type: null,
  })
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // ────────────────────────────────────────────────
  // Load profile + campaign settings
  // ────────────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user?.email) {
          setStatus({ message: 'Could not load user session.', type: 'error' })
          return
        }

        setUserEmail(user.email)

        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('email', user.email)
          .single()

        if (error || !data) {
          setStatus({ message: 'No client profile found.', type: 'error' })
          return
        }

        setProfile(data)
        setForm({
          name: data.name ?? '',
          timezone: data.timezone ?? '',
          vapi_assistant_id: data.vapi_assistant_id ?? '',
          country_code: data.country_code ?? '',
        })

        // Load campaign settings into UI-friendly days array
        if (data.campaign_settings?.daily_schedule?.length > 0) {
          const loadedDays = data.campaign_settings.daily_schedule.map((s: any) => {
            const actions = s.actions || []
            let action: CampaignDay['action'] = 'none'
            let times: string[] = []

            if (actions.length === 1) {
              action = actions[0].type
              times = actions[0].times || []
            } 
            // else if (actions.length === 2) {
            //   action = 'both'
            //   // Merge times (assuming same times for call & sms)
            //   times = [...new Set([...(actions[0].times || []), ...(actions[1].times || [])])]
            // }

            return {
              day_offset: s.day_offset,
              action,
              times,
            }
          })

          setDays(loadedDays)
        } else {
          // Default: one empty day
          setDays([{ day_offset: 0, action: 'none', times: [] }])
        }

        const rawSms = data.campaign_settings?.sms_templates
        if (rawSms && typeof rawSms === 'object' && !Array.isArray(rawSms)) {
          setSmsTemplates(
            Object.fromEntries(
              Object.entries(rawSms).filter(([, v]) => typeof v === 'string')
            ) as Record<string, string>
          )
        } else {
          setSmsTemplates({})
        }
      } catch (err) {
        setStatus({
          message: err instanceof Error ? err.message : 'Unexpected error loading profile.',
          type: 'error',
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // ────────────────────────────────────────────────
  // Day management helpers
  // ────────────────────────────────────────────────
  const addDay = () => {
    const newOffset = days.length > 0 ? days[days.length - 1].day_offset + 1 : 0
    setDays([...days, { day_offset: newOffset, action: 'none', times: [] }])
  }

  const removeDay = (index: number) => {
    if (days.length <= 1) return // keep at least one day
    setDays(days.filter((_, i) => i !== index))
  }

  const updateDay = (index: number, field: keyof CampaignDay, value: any) => {
    setDays(days.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  const toggleTime = (index: number, time: string) => {
    setDays(days.map((d, i) => {
      if (i !== index) return d
      const times = d.times.includes(time)
        ? d.times.filter(t => t !== time)
        : [...d.times, time].sort()
      return { ...d, times }
    }))
  }

  /** Canonical keys must match DB/API (`sms_1`, `sms_2`, …), not display labels. */
  const smsSlotKeys = useMemo(() => {
    const n = smsDaysInOrder(days).length
    return Array.from({ length: n }, (_, i) => `sms_${i + 1}`)
  }, [days])

  const updateSmsTemplate = (key: string, value: string) => {
    setSmsTemplates(prev => ({ ...prev, [key]: value }))
  }

  // ────────────────────────────────────────────────
  // Save handler
  // ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setStatus({ message: '', type: null })

    // Build campaign_settings object from UI days
    const dailySchedule = days
      .filter(d => d.action !== 'none' && d.times.length > 0)
      .map(d => {
        const actions = []
        if (d.action === 'call') {
          actions.push({ type: 'call', times: d.times })
        }
        if (d.action === 'sms') {
          actions.push({ type: 'sms', times: d.times })
        }
        return {
          day_offset: d.day_offset,
          actions,
        }
      })

    const smsDaysOrdered = smsDaysInOrder(days)
    const sms_templates: Record<string, string> = {}
    smsDaysOrdered.forEach((_, idx) => {
      const key = `sms_${idx + 1}`
      sms_templates[key] = (smsTemplates[key] ?? '').trim()
    })

    const campaignSettingsToSave =
      dailySchedule.length > 0
        ? {
            total_days: Math.max(...days.map(d => d.day_offset)) + 1,
            daily_schedule: dailySchedule,
            ...(Object.keys(sms_templates).length > 0 ? { sms_templates } : {}),
          }
        : null

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: form.name.trim() || null,
          timezone: form.timezone.trim() || null,
          vapi_assistant_id: form.vapi_assistant_id.trim() || null,
          country_code: form.country_code.trim() || null,
          campaign_settings: campaignSettingsToSave,
        })
        .eq('id', profile.id)

      if (error) throw error

      setStatus({ message: 'Settings saved successfully.', type: 'success' })
      setProfile(prev => prev ? { ...prev, campaign_settings: campaignSettingsToSave } : null)
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Failed to save settings.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 rounded-full animate-spin border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Scrollable main content */}
      <main className="flex-1 px-4 py-10 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">My Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account details, preferences, and campaign behavior.
          </p>
        </div>

        {/* Account Info (read-only) */}
        {profile && (
          <div className="p-6 mb-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500">
              Account Info
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Email</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {profile.email ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Member Since</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {profile.created_at ? formatDate(profile.created_at) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Account ID</p>
                <p className="mt-0.5 font-mono text-xs text-slate-400 break-all">
                  {profile.id}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Details */}
        {profile && (
          <div className="p-6 mb-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <h2 className="mb-5 text-sm font-semibold tracking-wide uppercase text-slate-500">
              Profile Details
            </h2>
            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Timezone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. Asia/Manila"
                  value={form.timezone}
                  onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Country Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. +63"
                  value={form.country_code}
                  onChange={e => setForm(f => ({ ...f, country_code: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">VAPI Assistant ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 font-mono text-sm border rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  value={form.vapi_assistant_id}
                  onChange={e => setForm(f => ({ ...f, vapi_assistant_id: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        )}

        {/* Campaign Settings */}
        {profile && (
          <div className="p-6 mb-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500">
              Campaign Settings
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Define what happens each day of the campaign (Day 1 = campaign start date). SMS
              template order follows SMS days from earliest to latest day.
            </p>

            <div className="space-y-6">
              {/* ~2 day cards tall, then scroll */}
              <div
                className="max-h-[min(34rem,52vh)] overflow-y-auto overscroll-y-contain space-y-6 pr-1 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4 [scrollbar-gutter:stable]"
              >
                {days.map((day, index) => (
                  <div
                    key={index}
                    className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-medium text-slate-800">
                        Day {day.day_offset + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={saving || days.length <= 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Action
                        </label>
                        <select
                          value={day.action}
                          onChange={e => updateDay(index, 'action', e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                          disabled={saving}
                        >
                          <option value="none">Do nothing</option>
                          <option value="call">Call only</option>
                          <option value="sms">SMS only</option>
                        </select>
                      </div>

                      {day.action !== 'none' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Times to contact (select one or more)
                          </label>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {availableTimes.map(time => (
                              <label key={time} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={day.times.includes(time)}
                                  onChange={() => toggleTime(index, time)}
                                  disabled={saving}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">{time}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addDay}
                className="w-full py-3 text-sm font-medium text-blue-600 transition border-2 border-blue-300 border-dashed rounded-xl hover:bg-blue-50 disabled:opacity-50"
                disabled={saving}
              >
                + Add Next Day
              </button>

              {smsSlotKeys.length > 0 && (
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                  <h3 className="text-base font-medium text-slate-800">SMS templates</h3>
                  <p className="text-sm text-slate-600">
                    First SMS day uses <span className="font-mono text-slate-800">SMS Template 1</span>,
                    second SMS day <span className="font-mono text-slate-800">SMS Template 2</span>, and
                    so on.
                  </p>
                  {smsSlotKeys.map((key, i) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        SMS Template #{i + 1}
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 text-sm border rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-y min-h-[4.5rem]"
                        placeholder="Message body for this SMS send..."
                        value={smsTemplates[key] ?? ''}
                        onChange={e => updateSmsTemplate(key, e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {profile && (
          <>
            {status.type && (
              <div
                className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-red-300 bg-red-50 text-red-800'
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </>
        )}
      </div>
      </main>
    </div>
  )
}