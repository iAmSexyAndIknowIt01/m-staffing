"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import ContractCandidates from "./ContractCandidates"
import ContractList from "./ContractList"
import TabSwitch, { tabPanelProps } from "./TabSwitch"

type Tab = "contracts" | "new"

interface Summary {
  awaiting: number
  drafts: number
  candidates: number
}

// Компанийн "Гэрээ" хуудас: үүссэн гэрээнүүд / тэнцсэн анкетаас шинээр үүсгэх.
// Сонгосон таб URL-д (?tab=new) хадгалагдана; табуудын шүүлтүүр бие биеэсээ тусдаа.
// Таб дээр анхаарах зүйлийн тоог харуулна (ноорог + гарын үсэг хүлээж буй, гэрээ хүлээж буй анкет).
export default function CompanyContractsTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab: Tab = searchParams.get("tab") === "new" ? "new" : "contracts"
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/company/contracts/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => !cancelled && result?.data && setSummary(result.data))
      .catch(() => {
        // Тоо харагдахгүй ч табууд ажиллана
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "contracts") params.delete("tab")
    else params.set("tab", next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const tabs = [
    { key: "contracts" as const, label: "📑 Гэрээнүүд", badge: summary ? summary.drafts + summary.awaiting : undefined },
    { key: "new" as const, label: "➕ Шинээр үүсгэх", badge: summary?.candidates },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <TabSwitch idPrefix="contracts" ariaLabel="Гэрээ" tabs={tabs} value={tab} onChange={selectTab} />
        {summary && (summary.drafts > 0 || summary.awaiting > 0) && (
          <p className="text-[11px] text-gray-400 px-1">
            {[
              summary.drafts > 0 && `${summary.drafts} ноорог илгээгээгүй`,
              summary.awaiting > 0 && `${summary.awaiting} гэрээ ажилтны гарын үсэг хүлээж байна`,
            ].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div {...tabPanelProps("contracts", tab)}>
        {tab === "contracts" ? <ContractList party="company" /> : <ContractCandidates />}
      </div>
    </div>
  )
}
