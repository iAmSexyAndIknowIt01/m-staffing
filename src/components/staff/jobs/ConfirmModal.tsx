"use client"

import React from "react"

interface ConfirmModalProps {
  show: boolean
  submitting: boolean
  sliderX: number
  isDragging: boolean
  trackRef: React.RefObject<HTMLDivElement | null>
  handleRef: React.RefObject<HTMLDivElement | null>
  onDragStart: (clientX: number) => void
  onClose: () => void
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
}: ConfirmModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 flex flex-col items-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner">
          ❓
        </div>
        <h3 className="text-lg md:text-xl font-black text-gray-900">Илгээхдээ итгэлтэй байна уу?</h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Анкет илгээх үйлдлийг баталгаажуулахын тулд баруун тийш чирнэ үү. Илгээсэн анкетыг цуцлах боломжгүй.
        </p>

        <div className="w-full mt-6 space-y-4">
          <div 
            ref={trackRef}
            className="relative w-full h-14 bg-gray-100 rounded-2xl p-1 flex items-center select-none overflow-hidden border border-gray-200/60"
          >
            <div 
              className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-400 transition-opacity"
              style={{ opacity: Math.max(1 - sliderX / 100, 0) }}
            >
              Баруун тийш чирж илгээх ➔
            </div>

            <div
              ref={handleRef}
              onMouseDown={(e) => onDragStart(e.clientX)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
              className="absolute top-1 bottom-1 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing shadow-lg transition-transform"
              style={{
                transform: `translateX(${sliderX}px)`,
                transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "🚀"
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-500 text-xs md:text-sm font-bold rounded-2xl transition"
          >
            Үгүй, буцах
          </button>
        </div>

      </div>
    </div>
  )
}