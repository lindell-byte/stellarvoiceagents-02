'use client'

import { useState } from 'react'
import { UploadLeadsForm } from './UploadLeadsForm'

type UploadLeadsModalProps = {
  onClose: () => void
  onSuccess?: () => void
}

export function UploadLeadsModal({ onClose, onSuccess }: UploadLeadsModalProps) {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(e) =>
        e.target === e.currentTarget && !isUploading && onClose()
      }
    >
      <UploadLeadsForm
        variant="modal"
        onClose={onClose}
        onSuccess={onSuccess}
        onUploadingChange={setIsUploading}
      />
    </div>
  )
}
