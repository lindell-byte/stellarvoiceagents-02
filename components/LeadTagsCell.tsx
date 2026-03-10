'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Lead } from '@/lib/leads-constants'

export type LeadTagsCellProps = {
  lead: Lead
  availableTags: string[]
  selectedTags: string[]
  onToggleTag: (lead: Lead, tag: string) => void
  onCreateTag: (lead: Lead, tagName: string) => void
  onDeleteTag?: (tagName: string) => void
}

export function LeadTagsCell({
  lead,
  availableTags,
  selectedTags,
  onToggleTag,
  onCreateTag,
  onDeleteTag,
}: LeadTagsCellProps) {
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleCreate = () => {
    const trimmed = newTagName.trim()
    if (!trimmed) return
    onCreateTag(lead, trimmed)
    setNewTagName('')
    setOpen(false)
  }

  const handleDeleteTag = async (tag: string) => {
    try {
      const res = await fetch(`/api/tags?name=${encodeURIComponent(tag)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete tag')
      window.dispatchEvent(new Event('tags:refresh'))
      setOpen(false)
    } catch (err) {
      console.error('Delete tag failed', err)
      alert('Failed to delete tag. Please try again.')
    }
  }

  const dropdownContent = open && (
    <div
      ref={dropdownRef}
      className="fixed z-[100] w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
      style={{
        top: dropdownRect.top,
        left: dropdownRect.left,
        opacity: 1,
        background: '#ffffff',
      }}
    >
      <div className="max-h-48 overflow-y-auto py-1">
        {availableTags.length === 0 && !newTagName.trim() && (
          <p className="px-3 py-2 text-xs text-slate-500">
            No tags yet. Create one below.
          </p>
        )}
        {availableTags.map((tag) => {
          const selected = selectedTags.includes(tag)
          return (
            <div
              key={tag}
              className="flex w-full items-center gap-2 bg-white px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  selected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selected ? '\u2713' : ''}
              </span>
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => onToggleTag(lead, tag)}
              >
                {tag}
              </button>
              <button
                type="button"
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                title={`Delete tag \"${tag}\"`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                    if (onDeleteTag) onDeleteTag(tag)
                    else handleDeleteTag(tag)
                }}
              >
                <span className="sr-only">Delete</span>
                🗑️
              </button>
            </div>
          )
        })}
      </div>
      <div className="border-t border-slate-100 bg-white px-2 py-2">
        <div className="flex gap-1">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            placeholder="New tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
          />
          <button
            type="button"
            className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            style={{ background: '#2563eb' }}
            onClick={handleCreate}
            disabled={!newTagName.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <td className="px-4 py-2.5 align-top">
      <div className="relative flex min-w-[140px] flex-wrap items-center gap-1">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            {tag}
            <button
              type="button"
              className="rounded p-0.5 hover:bg-slate-200"
              style={{ backgroundColor: 'transparent' }}
              onClick={() => onToggleTag(lead, tag)}
              title="Remove tag"
            >
              <span className="sr-only">Remove</span>
              &times;
            </button>
          </span>
        ))}
        <div className="relative inline-block">
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-dashed border-slate-300 px-2 text-xs text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
            style={{ backgroundColor: '#ffffff' }}
            onClick={() => setOpen((o) => !o)}
            title="Add tag"
          >
            {open ? '\u2715' : '+'}
          </button>
          {typeof document !== 'undefined' &&
            createPortal(dropdownContent, document.body)}
        </div>
      </div>
    </td>
  )
}
