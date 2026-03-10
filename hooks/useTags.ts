'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Lead } from '@/lib/leads-constants'

export type TagWithId = { id: string; name: string }

/** Fetch tags and lead-tags from API, persist changes. Uses lead.id for linking. */
export function useTags() {
  const [availableTags, setAvailableTags] = useState<TagWithId[]>([])
  const [tagsByLead, setTagsByLead] = useState<Record<string, TagWithId[]>>({})
  const [tagsLoading, setTagsLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    setTagsLoading(true)
    try {
      const [tagsRes, leadTagsRes] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/lead-tags'),
      ])
      if (!tagsRes.ok || !leadTagsRes.ok) return

      const { tags } = await tagsRes.json()
      const { leadTags } = await leadTagsRes.json()

      setAvailableTags(tags ?? [])

      const byLead: Record<string, TagWithId[]> = {}
      for (const lt of leadTags ?? []) {
        if (!lt.lead_id || !lt.tag_id) continue
        const t = (tags ?? []).find((x: TagWithId) => x.id === lt.tag_id)
        if (!t) continue
        if (!byLead[lt.lead_id]) byLead[lt.lead_id] = []
        byLead[lt.lead_id].push({ id: t.id, name: t.name })
      }
      setTagsByLead(byLead)
    } catch (err) {
      console.error('Failed to fetch tags', err)
    } finally {
      setTagsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    const handler = () => {
      fetchTags()
    }
    window.addEventListener('tags:refresh', handler as EventListener)
    return () => {
      window.removeEventListener('tags:refresh', handler as EventListener)
    }
  }, [fetchTags])

  const onToggleTag = useCallback(async (lead: Lead, tagName: string) => {
    const leadId = lead['id']
    if (!leadId) {
      alert('Lead has no id; cannot manage tags.')
      return
    }

    const current = tagsByLead[leadId] ?? []
    const isAdding = !current.some((t) => t.name === tagName)

    try {
      if (isAdding) {
        const res = await fetch('/api/lead-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: leadId, tag_name: tagName }),
        })
        if (!res.ok) throw new Error('Failed to add tag')
      } else {
        const tag = current.find((t) => t.name === tagName)
        if (!tag) return
        const res = await fetch(
          `/api/lead-tags?lead_id=${encodeURIComponent(leadId)}&tag_id=${encodeURIComponent(tag.id)}`,
          { method: 'DELETE' }
        )
        if (!res.ok) throw new Error('Failed to remove tag')
      }
      await fetchTags()
    } catch (err) {
      console.error('Toggle tag failed', err)
      alert('Failed to update tag. Please try again.')
    }
  }, [tagsByLead, fetchTags])

  const onCreateTag = useCallback(async (lead: Lead, tagName: string) => {
    const trimmed = tagName.trim()
    if (!trimmed) return

    const leadId = lead['id']
    if (!leadId) {
      alert('Lead has no id; cannot add tag.')
      return
    }

    try {
      const res = await fetch('/api/lead-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, tag_name: trimmed }),
      })
      if (!res.ok) throw new Error('Failed to add tag')
      await fetchTags()
    } catch (err) {
      console.error('Create tag failed', err)
      alert('Failed to add tag. Please try again.')
    }
  }, [fetchTags])

  const availableTagNames = availableTags.map((t) => t.name)
  const getSelectedTagsForLead = (lead: Lead): string[] => {
    const leadId = lead['id']
    if (!leadId) return []
    return (tagsByLead[leadId] ?? []).map((t) => t.name)
  }

  const deleteTag = useCallback(
    async (tagName: string) => {
      try {
        const res = await fetch(`/api/tags?name=${encodeURIComponent(tagName)}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Failed to delete tag')
        await fetchTags()
      } catch (err) {
        console.error('Delete tag failed', err)
        alert('Failed to delete tag. Please try again.')
      }
    },
    [fetchTags]
  )

  return {
    availableTagNames,
    tagsByLead,
    getSelectedTagsForLead,
    onToggleTag,
    onCreateTag,
    deleteTag,
    fetchTags,
    tagsLoading,
  }
}
