"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, Building2, Check, Loader2 } from "lucide-react"
import { showAlert, showConfirm } from "@/components/common/AppDialog"

interface PendingCompany {
  id: string
  company_name: string | null
  email: string | null
  phone: string | null
}

// Админ самбар: баталгаажуулалт хүлээж буй байгууллагууд. Баталгаажуулахад компанид имэйл очно.
export default function PendingCompanies({ reloadKey }: { reloadKey: number }) {
  const [companies, setCompanies] = useState<PendingCompany[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/companies", { cache: "no-store" })
      .then((res) => res.json())
      .then((result) => {
        if (cancelled) return
        if (result.success) {
          setCompanies(result.companies)
          setError(null)
        } else setError(result.error || "Байгууллагын жагсаалт татахад алдаа гарлаа.")
      })
      .catch(() => !cancelled && setError("Сүлжээний алдаа гарлаа."))
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const approve = async (company: PendingCompany) => {
    const ok = await showConfirm("Байгууллагыг баталгаажуулахад зар нийтлэх боломжтой болж, компанид имэйлээр мэдэгдэнэ.", {
      title: "Байгууллага баталгаажуулах",
      confirmLabel: "Баталгаажуулах",
      icon: BadgeCheck,
      subject: {
        name: company.company_name || "Нэр тодорхойгүй байгууллага",
        details: [company.email, company.phone].filter((v): v is string => !!v),
      },
    })
    if (!ok) return

    setActionId(company.id)
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: company.id }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Алдаа гарлаа.")
      setCompanies((prev) => prev.filter((c) => c.id !== company.id))
      showAlert(`${company.company_name || "Байгууллага"} баталгаажлаа.`, { tone: "success" })
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Серверийн алдаа гарлаа.", { tone: "error" })
    } finally {
      setActionId(null)
    }
  }

  // Хүлээгдэж буй байгууллага байхгүй бол хэсгийг нууна
  if (!loaded || (!error && companies.length === 0)) return null

  return (
    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <header className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">Баталгаажуулалт хүлээж буй байгууллага</h2>
          <p className="text-xs text-gray-500">{error ?? `${companies.length} байгууллага`}</p>
        </div>
      </header>
      {!error && (
        <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {companies.map((company) => (
            <li key={company.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{company.company_name || "Нэр тодорхойгүй"}</p>
                <p className="text-xs text-gray-400 truncate">{[company.email, company.phone].filter(Boolean).join(" · ") || company.id}</p>
              </div>
              <button
                type="button"
                onClick={() => approve(company)}
                disabled={actionId !== null}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {actionId === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Баталгаажуулах
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
