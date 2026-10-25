"use client"

import { useState } from "react"

// Supabase storage-ийн зам эсвэл бүтэн URL-ээс лого харуулах URL гаргана
export function getCompanyLogoUrl(logoUrl: string | null | undefined) {
  if (!logoUrl) return null
  if (logoUrl.startsWith("http")) return logoUrl
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return base ? `${base}/storage/v1/object/public/company-logos/${logoUrl}` : logoUrl
}

// Компанийн лого; лого байхгүй эсвэл ачаалагдахгүй бол нэрийн эхний 2 үсгийг харуулна
export function CompanyLogo({
  name,
  logoUrl,
  className = "w-12 h-12",
}: {
  name: string
  logoUrl: string | null | undefined
  className?: string
}) {
  const src = getCompanyLogoUrl(logoUrl)
  const [failed, setFailed] = useState(false)

  return (
    <span
      className={`${className} shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`${name} лого`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-bold text-orange-500 uppercase">{name.substring(0, 2) || "CO"}</span>
      )}
    </span>
  )
}

// Ажлын байрны жагсаалттай ижил: цэнхэр компанийн нэр + баруун талд нь баталгаажсан тэмдэг
export function VerifiedCompanyName({ name, className = "text-xs" }: { name: string; className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      <span className="font-semibold text-[#1877F2] truncate">{name}</span>
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 bg-[#1877F2] rounded-full text-white shrink-0"
        aria-label="Баталгаажсан байгууллага"
      >
        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </span>
    </span>
  )
}
