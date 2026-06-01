import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export const dynamic = 'force-dynamic'

export type CallActivity = {
  id: string
  timestamp: string | null
  ended_reason: string | null
  call_outcome: string | null
  summary: string | null
  call_duration_seconds: number | null
  recording_url: string | null
}

export type TextActivity = {
  id: string
  created_at: string | null
  status: string | null
  message_body: string | null
  phone_number_to: string | null
}

// n8n writes some values with a leading "=" (spreadsheet-formula artifact). Strip it for display.
function clean(value: string | null): string | null {
  if (typeof value !== 'string') return value
  return value.startsWith('=') ? value.slice(1) : value
}

/** GET /api/lead-activity?lead_id=... - returns the call and text history for one lead. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')

    if (!leadId) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const [callsRes, textsRes] = await Promise.all([
      supabase
        .from('call_logs')
        .select('id, timestamp, ended_reason, call_outcome, summary, call_duration_seconds, recording_url')
        .eq('lead_id', leadId)
        .order('timestamp', { ascending: true }),
      supabase
        .from('sms_logs')
        .select('id, created_at, status, message_body, phone_number_to')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true }),
    ])

    if (callsRes.error) {
      console.error('[api/lead-activity] call_logs', callsRes.error)
      return NextResponse.json({ error: callsRes.error.message }, { status: 500 })
    }
    if (textsRes.error) {
      console.error('[api/lead-activity] sms_logs', textsRes.error)
      return NextResponse.json({ error: textsRes.error.message }, { status: 500 })
    }

    const calls = (callsRes.data ?? []) as CallActivity[]
    const texts = ((textsRes.data ?? []) as TextActivity[]).map((t) => ({
      ...t,
      status: clean(t.status),
      message_body: clean(t.message_body),
      phone_number_to: clean(t.phone_number_to),
    }))

    return NextResponse.json({ calls, texts })
  } catch (err) {
    console.error('[api/lead-activity]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch lead activity' },
      { status: 500 }
    )
  }
}
