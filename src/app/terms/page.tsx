import type { Metadata } from "next"
import PublicPageShell from "@/components/landing/PublicPageShell"
import LegalDocument from "@/components/landing/LegalDocument"
import { SITE_NAME } from "@/lib/siteInfo"

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл",
  description: `${SITE_NAME} платформыг ашиглах нөхцөл, журам.`,
}

// Заалтуудыг админ DB-ээс шинэчилдэг тул хүсэлт бүрт уншина
export const dynamic = "force-dynamic"

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Хууль эрх зүй"
      title="Үйлчилгээний нөхцөл"
      description={`${SITE_NAME} платформд бүртгүүлж, ашиглахтай холбогдсон нөхцөл, хэрэглэгчийн эрх үүрэг.`}
    >
      <LegalDocument table="mt_terms" />
    </PublicPageShell>
  )
}
