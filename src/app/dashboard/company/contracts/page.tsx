import { Suspense } from "react"
import { redirect } from "next/navigation"
import LoadingLayout from "@/components/common/LoadingLayout"
import { getSession } from "@/lib/session"
import CompanyContractsTabs from "@/components/contracts/CompanyContractsTabs"

export const dynamic = "force-dynamic"

export default async function CompanyContractsPage() {
  const session = await getSession()
  if (!session?.userId || session.role !== "company") redirect("/dashboard")

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in px-4 sm:px-0 pb-6">
      <div className="mb-6 md:mb-8 pt-2">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Гэрээ 📑</h1>
        <p className="text-gray-500 mt-1 text-xs md:text-sm">
          Тэнцсэн ажилтнуудтай байгуулсан хөдөлмөрийн гэрээнүүд.
        </p>
      </div>
      {/* useSearchParams (шүүлтүүр URL-д) Suspense шаарддаг */}
      <Suspense fallback={<LoadingLayout loading={true} />}>
        <CompanyContractsTabs />
      </Suspense>
    </div>
  )
}
