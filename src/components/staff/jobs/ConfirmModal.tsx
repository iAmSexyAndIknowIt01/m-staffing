"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { HelpCircle, ChevronsRight } from "lucide-react"

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!show || !mounted) return null

  // createPortal ашиглан body рүү шууд гаргаж, z-index-ийг хамгийн өндөр болгоно
  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-100000 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
        
        {/* Асуултын тэмдэг бүхий дүрс */}
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 border border-indigo-100/50 shadow-xs">
          <HelpCircle className="w-6 h-6" />
        </div>

        <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
          Илгээхдээ итгэлтэй байна уу?
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed px-2">
          Анкет илгээх үйлдлийг баталгаажуулахын тулд баруун тийш чирнэ үү. Илгээсэн анкетыг цуцлах боломжгүй.
        </p>

        <div className="w-full mt-6 space-y-3">
          {/* Swipe Трэк (Track) */}
          <div 
            ref={trackRef}
            className="relative w-full h-14 bg-slate-50 rounded-xl p-1 flex items-center select-none overflow-hidden border border-slate-200/60 shadow-inner"
          >
            {/* Слайдер чирэгдэх үед арын дэвсгэрийг хөхрүүлж харуулах хэсэг */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-indigo-50/50 transition-all pointer-events-none"
              style={{ width: `${sliderX + 48}px` }}
            />

            {/* Чиглүүлэх Текст */}
            <div 
              className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 pointer-events-none select-none transition-opacity"
              style={{ opacity: Math.max(1 - sliderX / 120, 0) }}
            >
              <span>Баруун тийш чирж илгээх</span>
              <ChevronsRight className="w-4 h-4 animate-pulse" />
            </div>

            {/* Чирдэг Бариул (Handle) */}
            <div
              ref={handleRef}
              onMouseDown={(e) => onDragStart(e.clientX)}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
              className="absolute top-1 bottom-1 w-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold cursor-grab active:cursor-grabbing shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors select-none"
              style={{
                transform: `translateX(${sliderX}px)`,
                transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), bg-color 0.2s"
              }}
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronsRight className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Буцах товчлуур */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 text-xs md:text-sm font-bold rounded-xl shadow-xs transition duration-200 active:scale-98"
          >
            Үгүй, буцах
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}