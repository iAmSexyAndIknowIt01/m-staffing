import type { Metadata } from "next"
import LegalDocumentPage, { LEGAL_DOCS } from "@/components/legal/LegalDocumentPage"

export const metadata: Metadata = { title: LEGAL_DOCS.privacy.title, description: LEGAL_DOCS.privacy.description }

// Нийтийн /privacy хуудастай ижил агуулга, загвар — хянах самбарын дотор
export const dynamic = "force-dynamic"

export default function DashboardPrivacyPage() {
  return <LegalDocumentPage doc="privacy" context="dashboard" />
}
