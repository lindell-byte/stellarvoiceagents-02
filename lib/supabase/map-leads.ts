import type { Lead } from '@/lib/leads-constants'
import { CALL_SLOTS } from '@/lib/leads-constants'

/** Supabase leads_enquiries row (snake_case). Dates may be ISO strings from JSON. */
export type LeadsEnquiryRow = {
  id?: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  email?: string | null
  call_status?: string | null
  campaign_date?: string | null
  recordings_link?: string | null
  call_evaluation?: boolean | null
  call_1?: string | null
  call_2?: string | null
  call_3?: string | null
  call_4?: string | null
  call_5?: string | null
  call_6?: string | null
  call_7?: string | null
  call_8?: string | null
  call_9?: string | null
  [key: string]: unknown
}

function formatDate(value: string | Date | null | undefined): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value.toISOString ? value.toISOString().split('T')[0]! : ''
}

function formatTimestamp(value: string | Date | null | undefined): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value.toISOString ? value.toISOString() : String(value)
}

/** Map a Supabase leads_enquiries row to the app Lead shape (title-case keys). */
export function mapLeadsEnquiryToLead(row: LeadsEnquiryRow): Lead {
  const lead: Lead = {
    id: row.id ?? '',
    'First Name': row.first_name ?? '',
    'Last Name': row.last_name ?? '',
    'Phone Number': row.phone_number ?? '',
    Email: row.email ?? '',
    'Call Status': row.call_status ?? '',
    'Campaign Date': formatDate(row.campaign_date),
    'Recordings link': row.recordings_link ?? '',
    'Call Evaluation': row.call_evaluation === true ? 'TRUE' : row.call_evaluation === false ? 'FALSE' : '',
  }
  CALL_SLOTS.forEach((key, i) => {
    const col = `call_${i + 1}` as keyof LeadsEnquiryRow
    lead[key] = formatTimestamp(row[col] as string | Date | null | undefined)
  })
  return lead
}

/** Map Supabase leads table row to app Lead shape (for leads table which has fewer columns). */
export type LeadRow = {
  id?: string
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  email?: string | null
  call_status?: string | null
  campaign_date?: string | null
  [key: string]: unknown
}

export function mapLeadRowToLead(row: LeadRow): Lead {
  const lead: Lead = {
    id: row.id ?? '',
    'First Name': row.first_name ?? '',
    'Last Name': row.last_name ?? '',
    'Phone Number': row.phone_number ?? '',
    Email: row.email ?? '',
    'Call Status': row.call_status ?? '',
    'Campaign Date': formatDate(row.campaign_date),
    'Recordings link': '',
    'Call Evaluation': '',
  }
  CALL_SLOTS.forEach((key) => {
    lead[key] = ''
  })
  return lead
}
