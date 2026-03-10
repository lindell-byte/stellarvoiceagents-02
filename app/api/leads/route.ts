import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { mapLeadRowToLead, type LeadRow } from '@/lib/supabase/map-leads'
import type { Lead } from '@/lib/leads-constants'

export const dynamic = 'force-dynamic'

/** GET /api/leads - fetch leads from Supabase (leads table), return as { leads } in app shape. */
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/leads]', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
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
