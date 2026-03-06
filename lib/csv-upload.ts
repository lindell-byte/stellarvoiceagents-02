// Shared CSV parsing, transformation, and upload for leads import.
// Used by both the standalone upload page and the leads upload modal.

export const CSV_TEMPLATE = `First Name,Last Name,Phone Number,Email
John,Smith,2125551234,john@example.com
Jane,Doe,3105559876,jane@example.com`

export const N8N_UPLOAD_WEBHOOK_URL =
  'https://stan-n8n-u64462.vm.elestio.app/webhook/stellarvoiceagents-02-upload-csv'

export const FIRST_NAME_ALIASES = ['first name', 'firstname', 'first_name', 'given name']
export const LAST_NAME_ALIASES = ['last name', 'lastname', 'last_name', 'surname', 'family name']
export const NAME_ALIASES = ['name', 'full name', 'fullname', 'contact name']
export const PHONE_ALIASES = [
  'phone number',
  'phone',
  'mobile phone',
  'mobile',
  'tel',
  'telephone',
  'cell',
  'cell phone',
  'mobile number',
]
export const EMAIL_ALIASES = ['email', 'proxy email', 'e-mail', 'email address', 'e mail']

export type Contact = Record<string, string>
export type TransformedContact = Record<string, string>

export interface DuplicateContact {
  firstName: string
  lastName: string
  phone: string
}

export interface UploadResult {
  success: boolean
  added: number
  duplicates: number
  duplicateContacts: DuplicateContact[]
  errors: number
  error?: string
  message?: string
}

export function findColumnName(headers: string[], aliases: string[]): string | null {
  for (const header of headers) {
    if (aliases.includes(header.toLowerCase().trim())) {
      return header
    }
  }
  return null
}

function formatDateForWebhook(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string): Contact[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const headers = parseLine(lines[0], delimiter)

  const rows: Contact[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], delimiter)
    const row: Contact = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || ''
    }
    rows.push(row)
  }
  return rows
}

export function transformContacts(
  contacts: Contact[],
  selectedCampaignDate: string,
  isImmediate: boolean
): TransformedContact[] {
  const now = new Date()
  const dateCreated = formatDateForWebhook(now)
  const timeCreated = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (contacts.length === 0) return []

  const headers = Object.keys(contacts[0])
  const firstNameCol = findColumnName(headers, FIRST_NAME_ALIASES)
  const lastNameCol = findColumnName(headers, LAST_NAME_ALIASES)
  const nameCol = findColumnName(headers, NAME_ALIASES)
  const phoneCol = findColumnName(headers, PHONE_ALIASES)
  const emailCol = findColumnName(headers, EMAIL_ALIASES)

  const mappedCols = new Set(
    [firstNameCol, lastNameCol, nameCol, phoneCol, emailCol]
      .filter(Boolean)
      .map((c) => c!.toLowerCase())
  )

  return contacts.map((contact) => {
    let firstName = ''
    let lastName = ''

    if (firstNameCol) {
      firstName = contact[firstNameCol] || ''
      lastName = lastNameCol ? contact[lastNameCol] || '' : ''
    } else if (nameCol) {
      const fullName = contact[nameCol] || ''
      const nameParts = fullName.trim().split(' ')
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    }

    const phone = phoneCol ? contact[phoneCol] || '' : ''
    const email = emailCol ? contact[emailCol] || '' : ''

    const result: TransformedContact = {
      'First Name': firstName,
      'Last Name': lastName,
      'Phone Number': phone,
      Email: email,
      'Date Created': dateCreated,
      'Time Created': timeCreated,
      'Campaign Date': selectedCampaignDate,
      'Call Status': isImmediate ? 'Immediate call' : 'Scheduled',
    }

    for (const [key, value] of Object.entries(contact)) {
      if (!mappedCols.has(key.toLowerCase()) && !(key in result)) {
        result[key] = value || ''
      }
    }

    return result
  })
}

export async function uploadCsvToWebhook(
  file: File,
  options: { campaignDate: string; callImmediately: boolean },
  webhookUrl: string = N8N_UPLOAD_WEBHOOK_URL
): Promise<UploadResult> {
  const text = await file.text()
  const contacts = parseCSV(text)

  if (contacts.length === 0) {
    throw new Error('No valid data rows found in CSV file')
  }

  const headers = Object.keys(contacts[0])
  const hasFirstName = !!findColumnName(headers, FIRST_NAME_ALIASES)
  const hasFullName = !!findColumnName(headers, NAME_ALIASES)
  const hasPhone = !!findColumnName(headers, PHONE_ALIASES)
  const hasEmail = !!findColumnName(headers, EMAIL_ALIASES)

  if (!hasPhone || !hasEmail || (!hasFirstName && !hasFullName)) {
    throw new Error('CSV is missing required name, phone, or email columns.')
  }

  const effectiveDate = options.callImmediately
    ? (() => {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      })()
    : options.campaignDate

  const transformedContacts = transformContacts(
    contacts,
    effectiveDate,
    options.callImmediately
  )

  const response = await fetch(webhookUrl, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contacts: transformedContacts,
      callStatus: options.callImmediately ? 'Immediate call' : 'Scheduled',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Server responded with ${response.status}: ${errorText}`)
  }

  const responseText = await response.text()
  if (!responseText) {
    throw new Error('Server returned empty response. Check n8n workflow for errors.')
  }

  let result: UploadResult
  try {
    result = JSON.parse(responseText)
  } catch {
    throw new Error('Server returned invalid JSON: ' + responseText.substring(0, 100))
  }

  if (result.success === false) {
    throw new Error(result.error || 'Unknown error occurred')
  }

  return result
}
