"use client"

import React, { useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronsRight, Send, X } from "lucide-react"
import { useIsClient } from "@/lib/useIsClient"
import { CompanyLogo } from "@/components/staff/jobs/CompanyIdentity"

interface ConfirmModalProps {
  show: boolean
  submitting: boolean
  sliderX: number
  isDragging: boolean
  trackRef: React.RefObject<HTMLDivElement | null>
  handleRef: React.RefObject<HTMLDivElement | null>
  onDragStart: (clientX: number) => void
  onClose: () => void
  // Гараар (Enter/Space) баталгаажуулах — чирэх боломжгүй хэрэглэгчдэд
  onConfirm?: () => void
  job?: { title: string; company?: string; logoUrl?: string | null }
}

export default function ConfirmModal({
  show,
  submitting,
  sliderX,
  isDragging,
  trackRef,
  handleRef,
  onDragStart,
  onClose,
  onConfirm,
  job,
}: ConfirmModalProps) {
  const mounted = useIsClient()

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [show, submitting, onClose])

  if (!show || !mounted) return null

  // createPortal ашиглан body рүү шууд гаргаж, z-index-ийг хамгийн өндөр болгоно
  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100000 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-confirm-title"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Хаах"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-50 text-orange-600">
            <Send className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <h3 id="apply-confirm-title" className="mt-4 pr-8 text-lg font-semibold text-gray-900">
            Анкет илгээх
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
            Таны профайл ажил олгогчид илгээгдэнэ. Илгээсэн анкетыг цуцлах боломжгүйг анхаарна уу.
          </p>

          {job && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
              <CompanyLogo name={job.company || job.title} logoUrl={job.logoUrl} className="w-11 h-11 bg-white" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                {job.company && <p className="mt-0.5 text-xs text-gray-500 truncate">{job.company}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pt-4 pb-6 sm:pb-5 bg-gray-50 border-t border-gray-100 space-y-3">
          {/* Чирж баталгаажуулах трэк */}
          <div
            ref={trackRef}
            className="relative w-full h-14 bg-white rounded-2xl p-1 flex items-center select-none overflow-hidden border border-gray-200"
          >
            {/* Чирсэн хэмжээгээр дүүрэх дэвсгэр */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-orange-100 pointer-events-none"
              style={{ width: `${sliderX + 52}px`, transition: isDragging ? "none" : "width 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />

            <div
              className="absolute inset-0 flex items-center justify-center gap-1.5 pl-12 text-sm font-semibold text-gray-500 pointer-events-none select-none"
              style={{ opacity: submitting ? 1 : Math.max(1 - sliderX / 120, 0) }}
            >
              {submitting ? (
                <span className="text-orange-700">Илгээж байна...</span>
              ) : (
                <>
                  <span>Баруун тийш чирж илгээх</span>
                  <ChevronsRight className="w-4 h-4 text-orange-400 animate-pulse" />
                </>
              )}
            </div>

            <div
              ref={handleRef}
              role="button"
              tabIndex={0}
              aria-label="Чирж эсвэл Enter дарж анкет илгээх"
              onMouseDown={(e) => onDragStart(e.clientX)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && onConfirm && !submitting) {
                  e.preventDefault()
                  onConfirm()
                }
              }}
              className="relative h-full w-12 bg-orange-600 rounded-xl flex items-center justify-center text-white cursor-grab active:cursor-grabbing shadow-md shadow-orange-600/25 hover:bg-orange-700 outline-none focus-visible:ring-4 focus-visible:ring-orange-200 select-none"
              style={{
                transform: `translateX(${sliderX}px)`,
                transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronsRight className="w-5 h-5" />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full h-11 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Болих
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
