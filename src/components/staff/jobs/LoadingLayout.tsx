"use client"

import React from "react"

interface LoadingLayoutProps {
  loading: boolean
}

export default function LoadingLayout({ loading }: LoadingLayoutProps) {
  // Хэрэв loading төлөв идэвхгүй (false) байвал юу ч харуулахгүй
  if (!loading) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-100 py-24 w-full">
      <div className="relative flex items-center justify-center h-32 w-32">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-2 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center border border-gray-50 shadow-xs">
          <span className="text-xs font-black tracking-widest text-indigo-950 uppercase animate-[pulse_1.5s_ease-in-out_infinite]">
            mstaffing
          </span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mt-6 animate-pulse">
        Түр хүлээнэ үү...
      </p>
    </div>
  )
}