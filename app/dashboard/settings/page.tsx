'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClientProfile = {
  id: string
  created_at: string
  name: string | null
  email: string | null
  timezone: string | null
  vapi_assistant_id: string | null
  country_code: string | null
}

type StatusType = 'success' | 'error' | 'loading' | null

export default function SettingsPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [form, setForm] = useState({
    name: '',
    timezone: '',
    vapi_assistant_id: '',
    country_code: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({
    message: '',
    type: null,
  })
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

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

        if (error) {
          setStatus({
            message: 'No client profile found for your account.',
            type: 'error',
          })
          return
        }

        setProfile(data)
        setForm({
          name: data.name ?? '',
          timezone: data.timezone ?? '',
          vapi_assistant_id: data.vapi_assistant_id ?? '',
          country_code: data.country_code ?? '',
        })
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

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setStatus({ message: '', type: null })

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: form.name.trim() || null,
          timezone: form.timezone.trim() || null,
          vapi_assistant_id: form.vapi_assistant_id.trim() || null,
          country_code: form.country_code.trim() || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      setStatus({ message: 'Settings saved successfully.', type: 'success' })
      setProfile((prev) => prev ? { ...prev, ...form } : prev)
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 rounded-full animate-spin border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-10 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">My Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account details and preferences.
          </p>
        </div>

        {/* Account Info Card (read-only) */}
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
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  {profile.id}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error state when no profile */}
        {!profile && status.type === 'error' && (
          <div className="px-4 py-3 mb-6 text-sm text-red-800 border border-red-200 rounded-xl bg-red-50">
            {status.message}
          </div>
        )}

        {/* Editable Fields */}
        {profile && (
          <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
            <h2 className="mb-5 text-sm font-semibold tracking-wide uppercase text-slate-500">
              Profile Details
            </h2>

            <div className="space-y-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm transition border rounded-lg outline-none border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={saving}
                />
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Timezone
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm transition border rounded-lg outline-none border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. America/New_York"
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  disabled={saving}
                />
                <p className="text-xs text-slate-400">
                  Use IANA timezone format, e.g. <span className="font-mono">Asia/Manila</span>,{' '}
                  <span className="font-mono">America/New_York</span>
                </p>
              </div>

              {/* Country Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Country Code
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm transition border rounded-lg outline-none border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. +1, +63"
                  value={form.country_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country_code: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              {/* VAPI Assistant ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  VAPI Assistant ID
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 font-mono text-sm transition border rounded-lg outline-none border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  placeholder="vapi-assistant-id"
                  value={form.vapi_assistant_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vapi_assistant_id: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>
            </div>

            {/* Status message */}
            {status.type && status.type !== null && (
              <div
                className={`mt-5 rounded-lg border px-3 py-2 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : status.type === 'error'
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-blue-300 bg-blue-50 text-blue-800'
                }`}
              >
                {status.message}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="px-5 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}