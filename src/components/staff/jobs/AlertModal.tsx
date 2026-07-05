"use client"

import React from "react"

interface AlertModalState {
  show: boolean
  title: string
  message: string
}

interface AlertModalProps {
  alertModal: AlertModalState
  onClose: () => void
}

export default function AlertModal({ alertModal, onClose }: AlertModalProps) {
  // Хэрэв show нь false байвал юу ч дүрслэхгүй
  if (!alertModal.show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4">
        <h3 className="text-lg font-black text-gray-900">{alertModal.title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{alertModal.message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition text-center"
        >
          Хаах
        </button>
      </div>
    </div>
  )
}