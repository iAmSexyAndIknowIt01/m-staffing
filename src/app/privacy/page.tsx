import type { Metadata } from "next"
import LegalDocumentPage from "@/components/legal/LegalDocumentPage"
import { SITE_NAME } from "@/lib/siteInfo"

export const metadata: Metadata = {
  title: "Нууцлалын бодлого",
  description: `${SITE_NAME} хэрэглэгчийн хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг тухай.`,
  alternates: { canonical: "/privacy" },
}

// Заалтуудыг админ DB-ээс шинэчилдэг тул хүсэлт бүрт уншина
export const dynamic = "force-dynamic"

export default function PrivacyPage() {
  return <LegalDocumentPage doc="privacy" />
}
