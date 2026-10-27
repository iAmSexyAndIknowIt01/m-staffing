import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import LegalDocument from "@/components/landing/LegalDocument"

export const metadata: Metadata = { title: "Нууцлалын бодлого" }

// Нийтийн /privacy хуудастай ижил агуулгыг хянах самбарын дотор харуулна
export const dynamic = "force-dynamic"

export default function DashboardPrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-5 sm:space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Хянах самбар
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Нууцлалын бодлого</h1>
        <p className="text-sm text-gray-500 mt-1">Таны хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг тухай.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8">
        <LegalDocument table="mt_privacy" />
      </div>
    </div>
  )
}
