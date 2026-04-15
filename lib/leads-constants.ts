// Leads list constants and helpers. Used by dashboard leads page and components.

/** Dashboard leads list: fetched from Supabase via /api/leads. */
export const LEADS_API_URL = '/api/leads'

export const N8N_GET_LEADS_URL =
  'https://stan-n8n-u64462.vm.elestio.app/webhook/stellarvoiceagents-02-get-leads'
export const N8N_UPDATE_LEAD_URL =
  'https://stan-n8n-u64462.vm.elestio.app/webhook/stellarvoiceagents-02-update-lead'

export type Lead = Record<string, string>
export type FilterType = 'all' | 'active' | 'inactive' | 'hot'
export type SortDirection = 'asc' | 'desc'

export const CALL_SLOTS = [
  'Call #1',
  'Call #2',
  'Call #3',
  'Call #4',
  'Call #5',
  'Call #6',
  'Call #7',
  'Call #8',
  'Call #9',
]

export const CALL_STATUS_OPTIONS = [
  'Scheduled',
  'Immediate call',
  'In Progress',
  'Complete',
  'Deactivated',
]

export const DEACTIVATION_REASONS: Record<string, string[]> = {
  'Compliance': [
    'Do Not Call',
    'Abusive/Harassing',
  ],
  'Contact Issues': [
    'Wrong Number',
    'Disconnected/Invalid',
    'Unreachable',
    'Invalid Contact Info',
  ],
  'Business Logic': [
    'Already a Customer',
    'Already Using Competitor',
    'Business Closed',
    'Duplicate Lead',
  ],
  'Lead Quality': [
    'Not Interested',
    'Language Barrier',
    'No Callback Scheduled',
    'Data Quality Issue',
  ],
  'Admin': [
    'Manual Hold',
  ],
}

/** Fallback when tags API unavailable; app now loads from /api/tags */
export const TAGS_DEFAULT: string[] = []

export function isLeadActive(lead: Lead): boolean {
  const callStatus = String(lead['Call Status'] || '').toLowerCase().trim()
  const isComplete = callStatus === 'complete'
  const isDeactivated = callStatus === 'deactivated'
  // const allCallsFilled = CALL_SLOTS.every((slot) => String(lead[slot] || '').trim() !== '')
  const allCallsFilled = String(lead['Attempts Count']) == "11"
  return !isComplete && !isDeactivated && !allCallsFilled
}

export function isHotLead(lead: Lead): boolean {
  const callStatus = String(lead['Call Status'] || '').toLowerCase().trim()
  const isComplete = callStatus === 'complete'
  const hasRecording = String(lead['Recordings link'] || '').trim() !== ''
  const callEvaluation = String(lead['Call Evaluation'] || '').toUpperCase().trim()
  const evalIsTrue = callEvaluation === 'TRUE'
  // return isComplete && hasRecording && evalIsTrue
  return isComplete && evalIsTrue
}
