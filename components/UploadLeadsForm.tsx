'use client'

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import Link from 'next/link'
import {
  uploadCsvToWebhook,
  CSV_TEMPLATE,
  type UploadResult,
} from '@/lib/csv-upload'

type StatusType = 'success' | 'error' | 'loading' | null

type UploadLeadsFormProps = {
  variant: 'page' | 'modal'
  onSuccess?: () => void
  onClose?: () => void
  onUploadingChange?: (uploading: boolean) => void
}

export function UploadLeadsForm({
  variant,
  onSuccess,
  onClose,
  onUploadingChange,
}: UploadLeadsFormProps) {
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState<{ message: string; type: StatusType }>({
    message: '',
    type: null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [campaignDate, setCampaignDate] = useState('')
  const [callImmediately, setCallImmediately] = useState(false)
  const [importResult, setImportResult] = useState<UploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setStatus({ message: 'Please select a CSV file first.', type: 'error' })
      return
    }
    if (!callImmediately && !campaignDate) {
      setStatus({
        message: 'Please select a Campaign Date or enable "Call Immediately".',
        type: 'error',
      })
      return
    }

    setIsUploading(true)
    onUploadingChange?.(true)
    setImportResult(null)
    setStatus({ message: 'Reading and parsing CSV file...', type: 'loading' })

    try {
      setStatus({ message: 'Uploading contacts...', type: 'loading' })
      const result = await uploadCsvToWebhook(file, {
        campaignDate,
        callImmediately,
      })
      setImportResult(result)
      setStatus({ message: 'File processed successfully.', type: 'success' })
      onSuccess?.()
    } catch (error) {
      let errorMsg =
        'An error occurred: ' +
        (error instanceof Error ? error.message : 'Unknown error')
      if (
        error instanceof Error &&
        error.message === 'Failed to fetch'
      ) {
        errorMsg +=
          '\n\nPossible causes:\n1. The n8n workflow is not activated\n2. The webhook URL is incorrect\n3. Network/CORS issue'
      }
      setStatus({ message: errorMsg, type: 'error' })
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFileName('')
    }
  }

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'stellar-voice-agents-template.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFileName(e.target.files[0].name)
  }

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

  const isModal = variant === 'modal'
  const inputId = isModal ? 'csvFileModal' : 'csvFile'

  return (
    <div
      className={
        isModal
          ? 'w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl'
          : 'w-full max-w-xl self-start rounded-xl bg-white p-8 shadow-xl shadow-slate-900/5'
      }
    >
      {variant === 'page' && (
        <Link
          href="/dashboard/leads"
          className="mb-6 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-700 hover:-translate-x-0.5"
        >
          &larr; Back
        </Link>
      )}

      <div
        className={
          isModal
            ? 'mb-4 flex items-center justify-between'
            : 'mb-6 flex items-start justify-between gap-4'
        }
      >
        <div className="space-y-1">
          <h1
            className={
              isModal ? 'text-lg font-semibold text-slate-900' : 'text-xl font-semibold text-slate-900'
            }
          >
            Upload Leads
          </h1>
          <p className="text-sm text-slate-500">
            {isModal
              ? 'Upload a CSV file to add new Leads/Enquiries'
              : 'Upload your CSV file to add Leads/Enquiries'}
          </p>
        </div>
        {variant === 'page' && (
          <button
            className="mt-1 text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
            onClick={handleDownloadTemplate}
          >
            Download Template
          </button>
        )}
        {onClose && (
          <button
            className="text-xl leading-none text-slate-400 hover:text-slate-700 disabled:opacity-50"
            onClick={() => !isUploading && onClose()}
            type="button"
            disabled={isUploading}
          >
            &times;
          </button>
        )}
      </div>

      <input
        type="file"
        id={inputId}
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={`cursor-pointer rounded-lg border-2 border-dashed text-center transition ${
          isModal ? 'mb-4 px-4 py-6 text-sm' : 'mb-5 px-5 py-8'
        } ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : fileName
              ? 'border-green-500 bg-green-50'
              : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`text-blue-500 ${isModal ? 'mb-2 text-3xl' : 'mb-3 text-4xl'}`}>
          {fileName ? '\u2705' : '\uD83D\uDCC4'}
        </div>
        <p className="text-slate-500">
          {fileName ? 'File ready to upload' : 'Click to browse or drag & drop your CSV file'}
        </p>
        {fileName && (
          <p className={`font-semibold text-slate-900 ${isModal ? 'mt-1 text-sm' : 'mt-2 text-sm'}`}>
            {fileName}
          </p>
        )}
      </div>

      <div className={isModal ? 'mb-3 text-left' : 'my-4 text-left'}>
        <label className="flex cursor-pointer items-center text-sm text-slate-700">
          <input
            type="checkbox"
            checked={callImmediately}
            onChange={(e) => setCallImmediately(e.target.checked)}
            className="mr-2 h-4 w-4 cursor-pointer accent-blue-600"
          />
          <span className="font-medium">Call Immediately</span>
        </label>
      </div>

      <div
        className={`text-left transition ${
          callImmediately ? 'pointer-events-none opacity-50' : ''
        } ${isModal ? 'mb-4' : 'my-4'}`}
      >
        <label
          htmlFor={isModal ? 'campaignDateModal' : 'campaignDate'}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Campaign Date
        </label>
        {!isModal && (
          <p className="mb-1 text-xs text-slate-400">
            The date when the calls will be triggered
          </p>
        )}
        <input
          type="date"
          id={isModal ? 'campaignDateModal' : 'campaignDate'}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          value={campaignDate}
          min={minDate}
          onChange={(e) => setCampaignDate(e.target.value)}
          disabled={callImmediately}
        />
      </div>

      <button
        className={`w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${isModal ? 'mb-3' : 'mt-2'}`}
        onClick={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? 'Processing...' : 'Upload File'}
      </button>

      {status.type && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            status.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : status.type === 'error'
                ? 'whitespace-pre-line border-red-300 bg-red-50 text-red-800'
                : 'border-blue-300 bg-blue-50 text-blue-800'
          } ${isModal ? 'mb-3' : 'mt-5'} ${!isModal ? 'px-4 py-3 text-sm' : ''}`}
        >
          {status.message.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < status.message.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      )}

      {importResult && (
        <div className={isModal ? 'space-y-3 text-xs' : 'mt-5 space-y-4'}>
          <div className={`flex gap-2 ${!isModal && 'gap-3'}`}>
            <div
              className={`flex flex-1 flex-col gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-2 text-emerald-800 ${
                !isModal && 'px-3 py-2'
              }`}
            >
              <span className={isModal ? 'text-xl font-bold' : 'text-2xl font-bold'}>
                {importResult.added}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 sm:text-xs">
                Added
              </span>
            </div>
            <div
              className={`flex flex-1 flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-amber-800 ${
                !isModal && 'px-3 py-2'
              }`}
            >
              <span className={isModal ? 'text-xl font-bold' : 'text-2xl font-bold'}>
                {importResult.duplicates}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 sm:text-xs">
                Duplicates Skipped
              </span>
            </div>
          </div>

          {variant === 'page' &&
            importResult.duplicateContacts?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-amber-800">
                  Duplicate Leads/Enquiries Skipped
                </h3>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-amber-300">
                  <table className="min-w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="bg-amber-50 px-3 py-2 text-left font-semibold text-amber-800">
                          #
                        </th>
                        <th className="bg-amber-50 px-3 py-2 text-left font-semibold text-amber-800">
                          Name
                        </th>
                        <th className="bg-amber-50 px-3 py-2 text-left font-semibold text-amber-800">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.duplicateContacts.map((dup, i) => (
                        <tr key={i} className="border-t border-amber-100">
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2">
                            {`${dup.firstName} ${dup.lastName}`.trim() || '-'}
                          </td>
                          <td className="px-3 py-2">{dup.phone}</td>
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
