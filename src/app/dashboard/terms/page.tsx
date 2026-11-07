import type { Metadata } from "next"
import LegalDocumentPage, { LEGAL_DOCS } from "@/components/legal/LegalDocumentPage"

export const metadata: Metadata = { title: LEGAL_DOCS.terms.title, description: LEGAL_DOCS.terms.description }

// Нийтийн /terms хуудастай ижил агуулга, загвар — хянах самбарын дотор
export const dynamic = "force-dynamic"

export default function DashboardTermsPage() {
  return <LegalDocumentPage doc="terms" context="dashboard" />
}
