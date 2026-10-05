"use client"

import { useState } from "react"

interface ContractReasonDialogProps {
  title: string
  description: string
  confirmLabel: string
  required?: boolean
  busy?: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}

// Гэрээ цуцлах / татгалзах үед шалтгаан асуух цонх
export default function ContractReasonDialog({
  title,
  description,
  confirmLabel,
  required = true,
  busy = false,
  onConfirm,
  onClose,
}: ContractReasonDialogProps) {
  const [reason, setReason] = useState("")
  const invalid = required && reason.trim().length < 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs px-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-lg font-black text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={required ? "Шалтгаан (дор хаяж 5 тэмдэгт)" : "Шалтгаан (заавал биш)"}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-800"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition disabled:opacity-50">
            Болих
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={busy || invalid}
            className="text-sm font-bold px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition disabled:opacity-50"
          >
            {busy ? "Түр хүлээнэ үү..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
