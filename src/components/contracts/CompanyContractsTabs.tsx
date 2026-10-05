"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import ContractCandidates from "./ContractCandidates"
import ContractList from "./ContractList"

type Tab = "contracts" | "new"

const TABS: { key: Tab; label: string }[] = [
  { key: "contracts", label: "📑 Гэрээнүүд" },
  { key: "new", label: "➕ Шинээр үүсгэх" },
]

// Компанийн "Гэрээ" хуудас: үүссэн гэрээнүүд / тэнцсэн анкетаас шинээр үүсгэх.
// Сонгосон таб URL-д (?tab=new) хадгалагдана; табуудын шүүлтүүр бие биеэсээ тусдаа.
export default function CompanyContractsTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab: Tab = searchParams.get("tab") === "new" ? "new" : "contracts"

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "contracts") params.delete("tab")
    else params.set("tab", next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="inline-flex w-full sm:w-auto bg-gray-100/80 p-1 rounded-2xl">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              tab === t.key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contracts" ? <ContractList party="company" /> : <ContractCandidates />}
    </div>
  )
}
