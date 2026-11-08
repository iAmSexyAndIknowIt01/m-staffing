import type { Metadata } from "next"
import LegalDocumentPage from "@/components/legal/LegalDocumentPage"
import { SITE_NAME } from "@/lib/siteInfo"

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл",
  description: `${SITE_NAME} платформыг ашиглах нөхцөл, журам.`,
  alternates: { canonical: "/terms" },
}

// Заалтуудыг админ DB-ээс шинэчилдэг тул хүсэлт бүрт уншина
export const dynamic = "force-dynamic"

export default function TermsPage() {
  return <LegalDocumentPage doc="terms" />
}
