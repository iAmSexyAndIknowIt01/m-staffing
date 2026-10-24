"use client"

import { CheckCircle2 } from "lucide-react"
import React from "react"

interface SuccessModalProps {
  show: boolean
  onClose: () => void
}

export default function SuccessModal({ show, onClose }: SuccessModalProps) {
  // Хэрэв show нь false байвал юу ч дүрслэхгүй
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner animate-bounce">
          <CheckCircle2 size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-black text-gray-900">Амжилттай илгээгдлээ!</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Таны анкетыг хүлээн авлаа. Бид таны мэдээллийг хянаж үзээд эргэж холбогдох болно.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-orange-600/20 transition"
        >
          Ойлголоо
        </button>
      </div>
    </div>
  )
}