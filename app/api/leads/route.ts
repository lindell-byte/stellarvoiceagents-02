import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { mapLeadRowToLead, type LeadRow } from '@/lib/supabase/map-leads'
import type { Lead } from '@/lib/leads-constants'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/leads]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (data ?? []) as LeadRow[]
    const leads: Lead[] = rows.map(mapLeadRowToLead)
    return NextResponse.json({ leads })
  } catch (err) {
    console.error('[api/leads]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}