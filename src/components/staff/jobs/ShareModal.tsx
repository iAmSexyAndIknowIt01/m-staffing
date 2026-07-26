"use client"

import React, { useState } from "react"
import { Copy, Check, X, Share2 } from "lucide-react"

interface ShareModalProps {
  show: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    salary?: string
    mt_company?: { name: string }
  } | null
  formatSalary: (salary: string | undefined) => string
  showAlert: (message: string, title?: string) => void
}

export default function ShareModal({ show, onClose, job, formatSalary, showAlert }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!show || !job) return null

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/dashboard/jobs` // эсвэл тухайн зарын дэлгэрэнгүй линк
    : ""
  
  const shareTitle = `${job.title} - ${job.mt_company?.name || "Компани"} | Цалин: ${formatSalary(job.salary)}`

  // Линк хуулах
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      showAlert("Зарын линк санах ойд хуулагдлаа!", "Амжилттай")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Линк хуулахад алдаа гарлаа", err)
    }
  }

  // Сошиал линкүүд рүү үсрэх
  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToViber = () => {
    window.open(`viber://forward?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`, "_blank")
  }

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, "_blank")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Ажлын зар хуваалцах</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Энэхүү ажлын зарыг найз нөхөд болон олон нийтийн сүлжээнд хуваалцах:
        </p>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={shareToFacebook}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition gap-1.5"
          >
            <span className="text-xl font-bold">f</span>
            <span className="text-[11px] font-medium">Facebook</span>
          </button>

          <button
            onClick={shareToTelegram}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 text-sky-500 hover:bg-sky-100 transition gap-1.5"
          >
            <span className="text-xl">✈️</span>
            <span className="text-[11px] font-medium">Telegram</span>
          </button>

          <button
            onClick={shareToLinkedIn}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition gap-1.5"
          >
            <span className="text-lg font-bold">in</span>
            <span className="text-[11px] font-medium">LinkedIn</span>
          </button>

          <button
            onClick={shareToViber}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition gap-1.5"
          >
            <span className="text-lg">💬</span>
            <span className="text-[11px] font-medium">Viber</span>
          </button>
        </div>

        {/* Copy Link Section */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-2xl">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent px-3 text-xs text-gray-600 focus:outline-none truncate"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Хуулсан
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Хуулах
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}