'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LEADS_API_URL,
  type Lead,
  type FilterType,
  type SortDirection,
  isLeadActive,
  isHotLead,
} from '@/lib/leads-constants'
import { createClient } from '@/lib/supabase/client'

function parseDateValue(dateStr: string | number): number {
  const str = String(dateStr || '')
  if (!str.trim()) return 0
  const d = new Date(str.trim())
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

export function useLeads() {
  const supabase = useMemo(() => createClient(), [])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [updatingPhone, setUpdatingPhone] = useState<string | null>(null)

  // Resolve client_id once on mount
  useEffect(() => {
    async function resolveClientId() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user?.email) return
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single()
        if (!error && data?.id) setClientId(data.id)
      } catch (err) {
        console.error('Failed to resolve client id', err)
      }
    }
    resolveClientId()
  }, [supabase])

  const fetchLeads = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${LEADS_API_URL}?client_id=${clientId}`)
      if (!res.ok) throw new Error(`Failed to fetch leads (${res.status})`)
      const data = await res.json()
      setLeads(Array.isArray(data.leads) ? data.leads : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleToggleStatus = useCallback(
    async (lead: Lead) => {
      const phone = lead['Phone Number']
      if (!phone) return
      setUpdatingPhone(phone)
      const active = isLeadActive(lead)
      const newStatus = active ? 'Complete' : 'Scheduled'
      try {
        const { error } = await supabase
          .from('leads')
          .update({ call_status: newStatus })
          .eq('phone_number', phone)
          .eq('client_id', clientId)

        if (error) throw error

        setLeads(prev =>
          prev.map(l =>
            l['Phone Number'] === phone ? { ...l, 'Call Status': newStatus } : l
          )
        )
      } catch (err) {
        console.error('Failed to update status via Supabase', err)
        alert('Failed to update status. Please try again.')
      } finally {
        setUpdatingPhone(null)
      }
    },
    [clientId, supabase]
  )

  const handleEdit = useCallback((lead: Lead) => {
    setEditingLead(lead)
    setEditForm({
      'First Name': lead['First Name'] || '',
      'Last Name': lead['Last Name'] || '',
      Email: lead['Email'] || '',
      'Call Status': lead['Call Status'] || '',
      'Campaign Date': lead['Campaign Date'] || '',
    })
  }, [])

  const updateEditField = useCallback((field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSaveEdit = useCallback(
    async () => {
      if (!editingLead) return
      const phone = editingLead['Phone Number']
      setSaving(true)

      const payload = {
        first_name: (editForm['First Name'] || '').trim() || null,
        last_name: (editForm['Last Name'] || '').trim() || null,
        email: (editForm['Email'] || '').trim() || null,
        call_status: (editForm['Call Status'] || '').trim() || null,
        campaign_date: editForm['Campaign Date'] || null,
      }

      try {
        const { error } = await supabase
          .from('leads')
          .update(payload)
          .eq('phone_number', phone)
          .eq('client_id', clientId)

        if (error) throw error

        setLeads(prev =>
          prev.map(l =>
            l['Phone Number'] === phone ? { ...l, ...editForm } : l
          )
        )
        setEditingLead(null)
      } catch (err) {
        console.error('Failed to save lead via Supabase', err)
        alert('Failed to save changes. Please try again.')
      } finally {
        setSaving(false)
      }
    },
    [clientId, editForm, editingLead, supabase]
  )

  const filteredLeads = leads
    .filter((lead) => {
      if (filter === 'hot') return isHotLead(lead)
      const active = isLeadActive(lead)
      if (filter === 'active' && !active) return false
      if (filter === 'inactive' && (active || isHotLead(lead))) return false

      if (dateFilter) {
        const leadDate = String(lead['Campaign Date'] || '').trim()
        if (!leadDate) return false
        const leadDateNorm = new Date(leadDate)
        const filterDateNorm = new Date(dateFilter)
        if (
          isNaN(leadDateNorm.getTime()) ||
          leadDateNorm.toDateString() !== filterDateNorm.toDateString()
        )
          return false
      }

      if (search) {
        const q = search.toLowerCase()
        const name = `${String(lead['First Name'] || '')} ${String(
          lead['Last Name'] || ''
        )}`.toLowerCase()
        const phone = String(lead['Phone Number'] || '').toLowerCase()
        const email = String(lead['Email'] || '').toLowerCase()
        return name.includes(q) || phone.includes(q) || email.includes(q)
      }

      return true
    })
    .sort((a, b) => {
      const dateA = parseDateValue(a['Campaign Date'] || '')
      const dateB = parseDateValue(b['Campaign Date'] || '')
      return sortDir === 'desc' ? dateB - dateA : dateA - dateB
    })

  const hotLeads = leads.filter(isHotLead)
  const activeCount = leads.filter(isLeadActive).length
  const inactiveCount = leads.length - activeCount - hotLeads.length

  return {
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
  }
}