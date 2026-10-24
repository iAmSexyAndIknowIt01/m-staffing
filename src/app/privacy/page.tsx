import type { Metadata } from "next"
import PublicPageShell from "@/components/landing/PublicPageShell"
import LegalDocument from "@/components/landing/LegalDocument"
import { SITE_NAME } from "@/lib/siteInfo"

export const metadata: Metadata = {
  title: "Нууцлалын бодлого",
  description: `${SITE_NAME} хэрэглэгчийн хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг тухай.`,
}

// Заалтуудыг админ DB-ээс шинэчилдэг тул хүсэлт бүрт уншина
export const dynamic = "force-dynamic"

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Хууль эрх зүй"
      title="Нууцлалын бодлого"
      description="Таны хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг тухай."
    >
      <LegalDocument table="mt_privacy" />
    </PublicPageShell>
  )
}
