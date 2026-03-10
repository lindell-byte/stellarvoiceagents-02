import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const TABLE_LEADS = 'leads'
const TABLE_CLIENTS = 'clients'
const TABLE_CALL_LOGS = 'call_logs'
const TABLE_LEADS_ENQUIRIES = 'leads_enquiries'
const TABLE_OUTBOUND_NUMBERS = 'outbound_numbers'
const TABLE_SMS_LOGS = 'sms_logs'

function getSupabase(client?: SupabaseClient) {
  return client ?? createClient()
}

/** Fetch leads and console.log the data. Returns the data. */
export async function getLeads(supabase?: SupabaseClient) {
  const db = getSupabase(supabase)
  const { data, error } = await db.from(TABLE_LEADS).select('*')
  if (error) {
    console.error('[getLeads]', error)
    throw error
  }
  console.log('[getLeads]', data)
  return data
}

/** Fetch clients and console.log the data. Returns the data. */
export async function getClients(supabase?: SupabaseClient) {
  const db = getSupabase(supabase)
  const { data, error } = await db.from(TABLE_CLIENTS).select('*')
  if (error) {
    console.error('[getClients]', error)
    throw error
  }
  console.log('[getClients]', data)
  return data
}

/** Fetch call_logs and console.log the data. Returns the data. */
export async function getCallLogs(supabase?: SupabaseClient) {
  const db = getSupabase(supabase)
  const { data, error } = await db.from(TABLE_CALL_LOGS).select('*')
  if (error) {
    console.error('[getCallLogs]', error)
    throw error
  }
  console.log('[getCallLogs]', data)
  return data
}

/** Fetch leads_enquiries and console.log the data. Returns the data. */
export async function getLeadsEnquiries(supabase?: SupabaseClient) {
  const db = getSupabase(supabase)
  const { data, error } = await db.from(TABLE_LEADS_ENQUIRIES).select('*')
  if (error) {
    console.error('[getLeadsEnquiries]', error)
    throw error
  }
  console.log('[getLeadsEnquiries]', data)
  return data
}

/** Fetch outbound_numbers and console.log the data. Returns the data. */
export async function getOutboundNumbers(supabase?: SupabaseClient) {
  const db = getSupabase(supabase)
  const { data, error } = await db.from(TABLE_OUTBOUND_NUMBERS).select('*')
  if (error) {
    console.error('[getOutboundNumbers]', error)
    throw error
  }
  console.log('[getOutboundNumbers]', data)
  return data
}

/** Fetch sms_logs and console.log the data. Returns the data. */
export async function getSmsLogs(supabase?: SupabaseClient) {
  const db = getSupabase(supabase)
  const { data, error } = await db.from(TABLE_SMS_LOGS).select('*')
  if (error) {
    console.error('[getSmsLogs]', error)
    throw error
  }
  console.log('[getSmsLogs]', data)
  return data
}

/** Fetch all tables and console.log each. Returns combined result. Pass server client from API routes. */
export async function getAll(supabase?: SupabaseClient) {
  console.log('--- Supabase data getters ---')
  const [leads, clients, callLogs, leadsEnquiries, outboundNumbers, smsLogs] =
    await Promise.all([
      getLeads(supabase),
      getClients(supabase),
      getCallLogs(supabase),
      getLeadsEnquiries(supabase),
      getOutboundNumbers(supabase),
      getSmsLogs(supabase),
    ])
  console.log('--- done ---')
  return {
    leads,
    clients,
    call_logs: callLogs,
    leads_enquiries: leadsEnquiries,
    outbound_numbers: outboundNumbers,
    sms_logs: smsLogs,
  }
}
