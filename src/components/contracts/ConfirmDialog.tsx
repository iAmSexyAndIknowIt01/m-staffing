"use client"

import { useEffect } from "react"

// Гэрээний үйлдлийг баталгаажуулах цонх (browser-ийн confirm()-ийн оронд).
// Escape эсвэл ард нь дарахад хаагдана — хүсэлт явж байх үед (busy) хаагдахгүй.

export function useDialogEscape(onClose: () => void, busy: boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, busy])
}

interface ConfirmDialogProps {
  title: string
  description: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: "primary" | "danger"
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Болих",
  tone = "primary",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useDialogEscape(onClose, busy)

  const confirmClass = tone === "danger" ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs px-4" onClick={() => !busy && onClose()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 id="confirm-dialog-title" className="text-lg font-black text-gray-900">{title}</h3>
          <div className="text-sm text-gray-500 mt-1 space-y-2">{description}</div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={busy} className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className={`text-sm font-bold px-4 py-2.5 rounded-xl text-white transition disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? "Түр хүлээнэ үү..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
