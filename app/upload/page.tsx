'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import Link from 'next/link'

// ========== WEBHOOK CONFIG (change per client) ==========
const N8N_WEBHOOK_URL = 'https://stan-n8n-u64462.vm.elestio.app/webhook/stellarvoiceagents-02-upload-csv'
// =========================================================

// CSV Template showing preferred format (US phone numbers)
const CSV_TEMPLATE = `First Name,Last Name,Phone Number,Email
John,Smith,2125551234,john@example.com
Jane,Doe,3105559876,jane@example.com`

// Flexible column name aliases for matching CSV headers
const FIRST_NAME_ALIASES = ['first name', 'firstname', 'first_name', 'given name']
const LAST_NAME_ALIASES = ['last name', 'lastname', 'last_name', 'surname', 'family name']
const NAME_ALIASES = ['name', 'full name', 'fullname', 'contact name']
const PHONE_ALIASES = ['phone number', 'phone', 'mobile phone', 'mobile', 'tel', 'telephone', 'cell', 'cell phone', 'mobile number']
const EMAIL_ALIASES = ['email', 'proxy email', 'e-mail', 'email address', 'e mail']

const findColumnName = (headers: string[], aliases: string[]): string | null => {
  for (const header of headers) {
    if (aliases.includes(header.toLowerCase().trim())) {
      return header
    }
  }
  return null
}

type Contact = Record<string, string>
type TransformedContact = Record<string, string>

interface DuplicateContact {
  firstName: string
  lastName: string
  phone: string
}

interface UploadResult {
  success: boolean
  added: number
  duplicates: number
  duplicateContacts: DuplicateContact[]
  errors: number
  error?: string
  message?: string
}

type StatusType = 'success' | 'error' | 'loading' | null

// Format date as YYYY-MM-DD
const formatDateForWebhook = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format date as MM/DD/YYYY for display (US format)
const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US')
}

export default function Home() {
  const [fileName, setFileName] = useState<string>('')
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({ message: '', type: null })
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [campaignDate, setCampaignDate] = useState<string>('')
  const [callImmediately, setCallImmediately] = useState(false)
  const [importResult, setImportResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse CSV line handling quoted values
  const parseLine = (line: string, delimiter: string): string[] => {
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

  // Parse CSV file content
  const parseCSV = (text: string): Contact[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 2) return []

    // Detect delimiter (tab or comma)
    const delimiter = lines[0].includes('\t') ? '\t' : ','

    // Parse header
    const headers = parseLine(lines[0], delimiter)

    // Parse rows
    const rows: Contact[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i], delimiter)
      const row: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || ''
      }
      rows.push(row as Contact)
    }
    return rows
  }

  // Transform CSV contacts to Google Sheet format
  const transformContacts = (contacts: Contact[], selectedCampaignDate: string, isImmediate: boolean): TransformedContact[] => {
    const now = new Date()
    const dateCreated = formatDateForWebhook(now)
    const timeCreated = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    if (contacts.length === 0) return []

    // Find column mappings from actual CSV headers
    const headers = Object.keys(contacts[0])
    const firstNameCol = findColumnName(headers, FIRST_NAME_ALIASES)
    const lastNameCol = findColumnName(headers, LAST_NAME_ALIASES)
    const nameCol = findColumnName(headers, NAME_ALIASES)
    const phoneCol = findColumnName(headers, PHONE_ALIASES)
    const emailCol = findColumnName(headers, EMAIL_ALIASES)

    // Track which columns are mapped to standard names (to avoid duplicates)
    const mappedCols = new Set(
      [firstNameCol, lastNameCol, nameCol, phoneCol, emailCol]
        .filter(Boolean)
        .map(c => c!.toLowerCase())
    )

    return contacts.map(contact => {
      // Extract core fields using flexible column matching
      let firstName = ''
      let lastName = ''

      if (firstNameCol) {
        firstName = contact[firstNameCol] || ''
        lastName = lastNameCol ? (contact[lastNameCol] || '') : ''
      } else if (nameCol) {
        const fullName = contact[nameCol] || ''
        const nameParts = fullName.trim().split(' ')
        firstName = nameParts[0] || ''
        lastName = nameParts.slice(1).join(' ') || ''
      }

      const phone = phoneCol ? (contact[phoneCol] || '') : ''
      const email = emailCol ? (contact[emailCol] || '') : ''

      // Build result with standard column names for core fields
      const result: TransformedContact = {
        'First Name': firstName,
        'Last Name': lastName,
        'Phone Number': phone,
        'Email': email,
        'Date Created': dateCreated,
        'Time Created': timeCreated,
        'Campaign Date': selectedCampaignDate,
        'Call Status': isImmediate ? 'Immediate call' : 'Scheduled'
      }

      // Pass through any additional columns from the CSV
      for (const [key, value] of Object.entries(contact)) {
        if (!mappedCols.has(key.toLowerCase()) && !(key in result)) {
          result[key] = value || ''
        }
      }

      return result
    })
  }

  // Handle file upload
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setStatus({ message: 'Please select a CSV file first.', type: 'error' })
      return
    }

    if (!callImmediately && !campaignDate) {
      setStatus({ message: 'Please select a Campaign Date or enable "Call Immediately".', type: 'error' })
      return
    }

    setIsUploading(true)
    setImportResult(null)
    setStatus({ message: 'Reading and parsing CSV file...', type: 'loading' })

    try {
      // Read file content
      const text = await file.text()
      const contacts = parseCSV(text)

      if (contacts.length === 0) {
        throw new Error('No valid data rows found in CSV file')
      }

      // Validate required columns using flexible matching
      const headers = Object.keys(contacts[0])
      const hasFirstName = !!findColumnName(headers, FIRST_NAME_ALIASES)
      const hasFullName = !!findColumnName(headers, NAME_ALIASES)
      const hasPhone = !!findColumnName(headers, PHONE_ALIASES)
      const hasEmail = !!findColumnName(headers, EMAIL_ALIASES)

      if ((!hasFirstName && !hasFullName) || !hasPhone || !hasEmail) {
        const missing: string[] = []
        if (!hasFirstName && !hasFullName) missing.push('"First Name" (or "Name")')
        if (!hasPhone) missing.push('"Phone Number" (or "Phone", "Mobile Phone")')
        if (!hasEmail) missing.push('"Email" (or "Proxy Email", "E-mail")')
        throw new Error(`CSV is missing required columns: ${missing.join(', ')}. Download the template for the recommended format.`)
      }

      // Use today's date if calling immediately, otherwise use selected date
      const effectiveDate = callImmediately ? formatDateForWebhook(new Date()) : campaignDate

      // Transform to Google Sheet format with selected campaign date
      const transformedContacts = transformContacts(contacts, effectiveDate, callImmediately)

      setStatus({ message: `Uploading ${transformedContacts.length} contacts...`, type: 'loading' })

      // Send to webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts: transformedContacts,
          callStatus: callImmediately ? 'Immediate call' : 'Scheduled'
        })
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

      setImportResult(result)
      setStatus({ message: 'File processed successfully.', type: 'success' })

    } catch (error) {
      let errorMsg = 'An error occurred: ' + (error instanceof Error ? error.message : 'Unknown error')
      if (error instanceof Error && error.message === 'Failed to fetch') {
        errorMsg += '\n\nPossible causes:\n1. The n8n workflow is not activated\n2. The webhook URL is incorrect\n3. Network/CORS issue'
      }
      setStatus({ message: errorMsg, type: 'error' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setFileName('')
    }
  }

  // Handle template download
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'stellar-voice-agents-template.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files
      setFileName(files[0].name)
    }
  }

  // Get tomorrow's date in YYYY-MM-DD format for min date (cannot schedule for today)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="container">
      <Link href="/" className="btn-back">&larr; Back</Link>
      <div className="header">
        <div className="header-text">
          <h1>Upload Leads</h1>
          <p className="subtitle">Upload your CSV file to add Leads/Enquiries</p>
        </div>
        <button
          className="btn-template"
          onClick={handleDownloadTemplate}
        >
          Download Template
        </button>
      </div>

      <input
        type="file"
        id="csvFile"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''} ${fileName ? 'has-file' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-area-icon">{fileName ? '\u2705' : '\uD83D\uDCC4'}</div>
        <p>{fileName ? 'File ready to upload' : 'Click to browse or drag & drop your CSV file'}</p>
        {fileName && <p className="file-name">{fileName}</p>}
      </div>

      <div className="checkbox-container">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={callImmediately}
            onChange={(e) => setCallImmediately(e.target.checked)}
          />
          <span className="checkbox-text">Call Immediately</span>
        </label>
      </div>

      <div className={`date-picker-container ${callImmediately ? 'disabled' : ''}`}>
        <label htmlFor="campaignDate" className="date-label">
          Campaign Date
        </label>
        <p className="field-hint">The date when the calls will be triggered</p>
        <input
          type="date"
          id="campaignDate"
          className="date-input"
          value={campaignDate}
          min={minDate}
          onChange={(e) => setCampaignDate(e.target.value)}
          disabled={callImmediately}
        />
      </div>

      <button
        className="btn"
        onClick={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? 'Processing...' : 'Upload File'}
      </button>

      {status.type && (
        <div className={`status ${status.type}`}>
          {status.message.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < status.message.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      )}

      {importResult && (
        <div className="import-results">
          <div className="results-summary">
            <div className="result-card added">
              <span className="result-number">{importResult.added}</span>
              <span className="result-label">Added</span>
            </div>
            <div className="result-card duplicates">
              <span className="result-number">{importResult.duplicates}</span>
              <span className="result-label">Duplicates Skipped</span>
            </div>
          </div>

          {importResult.duplicateContacts && importResult.duplicateContacts.length > 0 && (
            <div className="duplicates-section">
              <h3 className="duplicates-title">Duplicate Leads/Enquiries Skipped</h3>
              <div className="duplicates-table-wrapper">
                <table className="duplicates-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.duplicateContacts.map((dup, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{`${dup.firstName} ${dup.lastName}`.trim() || '-'}</td>
                        <td>{dup.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
