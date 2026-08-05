"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, X } from "lucide-react"

interface ProfileIncompleteModalProps {
  show: boolean
  onClose: () => void
  message?: string
}

export default function ProfileIncompleteModal({
  show,
  onClose,
  message
}: ProfileIncompleteModalProps) {
  const router = useRouter()

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative text-center space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Хаах товч */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Икон */}
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Гарчиг болон мессеж */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900">Профайл мэдээлэл дутуу</h3>
          <p className="text-sm text-gray-500 leading-relaxed px-4">
            {message || "Ажилд анкетаа илгээхийн тулд та профайл мэдээллээ бүрэн бөглөх шаардлагатай байна."}
          </p>
        </div>

        {/* Үйлдлийн товчлуурууд */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            Болих
          </button>
          <button
            onClick={() => {
              onClose()
              router.push("/dashboard/staff/profile")
            }}
            className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold text-white bg-linear-to-r from-orange-500 to-amber-500 hover:opacity-95 transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            Профайл засах <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}