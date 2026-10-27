"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { CheckCircle2, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"

interface SuccessModalProps {
  show: boolean
  onClose: () => void
}

export default function SuccessModal({ show, onClose }: SuccessModalProps) {
  const mounted = useIsClient()

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [show, onClose])

  if (!show || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100000 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-success-title"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Хаах"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pb-5 text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-8 h-8" strokeWidth={1.8} />
          </div>
          <h3 id="apply-success-title" className="mt-5 text-lg font-semibold text-gray-900">
            Анкет амжилттай илгээгдлээ
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            Ажил олгогч таны анкетыг хянаж үзээд хариу өгнө. Явцыг «Миний хүсэлтүүд» хэсгээс харах боломжтой.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition"
          >
            Ойлголоо
          </button>
          <Link
            href="/dashboard/staff/requests"
            className="h-11 px-5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 inline-flex items-center justify-center transition"
          >
            Миний хүсэлтүүд
          </Link>
        </div>
      </div>
    </div>,
    document.body
  )
}
