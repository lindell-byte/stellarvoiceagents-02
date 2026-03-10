import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import {
  getAll,
  getLeads,
  getClients,
  getCallLogs,
  getLeadsEnquiries,
  getOutboundNumbers,
  getSmsLogs,
} from '@/lib/supabase/data-getters'

export const dynamic = 'force-dynamic'

/** GET /api/debug-data - fetches Supabase tables, logs to server console (terminal), returns JSON. */
/** GET /api/debug-data?table=leads - fetch one table only. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const supabase = createServerClient()

  try {
    if (table) {
      switch (table) {
        case 'leads': {
          const data = await getLeads(supabase)
          return NextResponse.json({ [table]: data })
        }
        case 'clients': {
          const data = await getClients(supabase)
          return NextResponse.json({ [table]: data })
        }
        case 'call_logs': {
          const data = await getCallLogs(supabase)
          return NextResponse.json({ [table]: data })
        }
        case 'leads_enquiries': {
          const data = await getLeadsEnquiries(supabase)
          return NextResponse.json({ [table]: data })
        }
        case 'outbound_numbers': {
          const data = await getOutboundNumbers(supabase)
          return NextResponse.json({ [table]: data })
        }
        case 'sms_logs': {
          const data = await getSmsLogs(supabase)
          return NextResponse.json({ [table]: data })
        }
        default:
          return NextResponse.json(
            { error: `Unknown table: ${table}. Use: leads, clients, call_logs, leads_enquiries, outbound_numbers, sms_logs` },
            { status: 400 }
          )
      }
    }

    const data = await getAll(supabase)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[debug-data]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
