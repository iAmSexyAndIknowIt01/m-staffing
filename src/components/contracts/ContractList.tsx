"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type SetStateAction } from "react"
import LoadingLayout from "@/components/common/LoadingLayout"
import Pagination from "@/components/staff/jobs/Pagination"
import { getErrorMessage } from "@/lib/errors"
import { CONTRACT_STATUS_LABELS, SALARY_TYPE_LABELS } from "@/lib/contracts"
import type { ContractParty, ContractSalaryType, ContractStatus } from "@/types/contract"
import ApplicantDetailModal from "./ApplicantDetailModal"
import ContractStatusBadge from "./ContractStatusBadge"
import { DateRange, LabeledSelect, ResultSummary, SearchInput, filterSelectClass } from "./FilterControls"
import { formatDate, formatSalary } from "./format"
import { useListParams, useRememberListQuery, visiblePageNumbers } from "./listState"

const PAGE_SIZE = 10

type Sortable = { created_at: string; salary: number; start_date: string }

const SORTS = {
  new: { label: "Шинэ нь эхэндээ", compare: (a: Sortable, b: Sortable) => b.created_at.localeCompare(a.created_at) },
  old: { label: "Хуучин нь эхэндээ", compare: (a: Sortable, b: Sortable) => a.created_at.localeCompare(b.created_at) },
  salary_desc: { label: "Цалин: их → бага", compare: (a: Sortable, b: Sortable) => b.salary - a.salary },
  salary_asc: { label: "Цалин: бага → их", compare: (a: Sortable, b: Sortable) => a.salary - b.salary },
  start_asc: { label: "Эхлэх огноо: эрт → орой", compare: (a: Sortable, b: Sortable) => a.start_date.localeCompare(b.start_date) },
  start_desc: { label: "Эхлэх огноо: орой → эрт", compare: (a: Sortable, b: Sortable) => b.start_date.localeCompare(a.start_date) },
}

type SortKey = keyof typeof SORTS

interface ContractListItem {
  id: string
  job_request_id?: string // зөвхөн компанийн API буцаана
  contract_number: string
  company_name: string
  staff_name: string
  position: string
  salary: number
  salary_type: ContractSalaryType
  start_date: string
  end_date: string | null
  status: ContractStatus
  created_at: string
}

interface ContractListProps {
  party: ContractParty
}

// Компани, ажилтны "Гэрээ" жагсаалт. Нөгөө талын нэрийг харуулна.
export default function ContractList({ party }: ContractListProps) {
  const [contracts, setContracts] = useState<ContractListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ContractListItem | null>(null)
  const [clearCount, setClearCount] = useState(0)
  const router = useRouter()

  // Шүүлтүүр, эрэмбэ, хуудас URL-д хадгалагдана
  const { get, update } = useListParams()
  useRememberListQuery()
  const searchQuery = get("q")
  const statusFilter = get("status", "all")
  const positionFilter = get("position", "all")
  const salaryTypeFilter = get("stype", "all")
  const startFrom = get("from")
  const startTo = get("to")
  const sort = (get("sort", "new") in SORTS ? get("sort", "new") : "new") as SortKey
  const page = Math.max(1, Number(get("page", "1")) || 1)
  const hasFilters = Boolean(searchQuery || startFrom || startTo) ||
    [statusFilter, positionFilter, salaryTypeFilter].some((v) => v !== "all")

  const clearFilters = () => {
    update({ q: null, status: null, position: null, stype: null, from: null, to: null })
    setClearCount((n) => n + 1)
  }

  // Компани мөр дээр дарахад ажилтны дэлгэрэнгүй цонх нээгдэнэ
  const openDetail = (c: ContractListItem) => {
    if (party === "company" && c.job_request_id) setSelected(c)
  }

  const basePath = `/dashboard/${party}/contracts`

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch(`/api/${party}/contracts`)
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || "Гэрээ татахад алдаа гарлаа")
        setContracts(result.data || [])
      } catch (err) {
        setError(getErrorMessage(err, "Серверийн алдаа гарлаа"))
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [party])

  const counterparty = (c: ContractListItem) => (party === "company" ? c.staff_name : c.company_name)

  const statusOptions = useMemo(() => {
    const present = new Set(contracts.map((c) => c.status))
    return (Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).filter((s) => present.has(s))
  }, [contracts])

  const positions = useMemo(() => Array.from(new Set(contracts.map((c) => c.position))).sort(), [contracts])

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const result = contracts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (positionFilter !== "all" && c.position !== positionFilter) return false
      if (salaryTypeFilter !== "all" && c.salary_type !== salaryTypeFilter) return false
      if (startFrom && c.start_date < startFrom) return false
      if (startTo && c.start_date > startTo) return false
      if (!query) return true
      return (
        c.contract_number.toLowerCase().includes(query) ||
        c.position.toLowerCase().includes(query) ||
        (party === "company" ? c.staff_name : c.company_name).toLowerCase().includes(query)
      )
    })
    return result.sort(SORTS[sort].compare)
  }, [contracts, statusFilter, positionFilter, salaryTypeFilter, startFrom, startTo, searchQuery, sort, party])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const setPage = (next: SetStateAction<number>) =>
    update({ page: typeof next === "function" ? next(currentPage) : next })

  if (loading) return <LoadingLayout loading={true} />

  if (error) return <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{error}</div>

  if (contracts.length === 0) {
    return (
      <div className="p-10 sm:p-16 bg-white border border-gray-100 rounded-3xl sm:rounded-4xl text-center text-gray-400 shadow-sm">
        <span className="text-3xl sm:text-4xl block mb-3">📑</span>
        <div className="font-bold text-gray-700 mb-1 text-sm sm:text-base">Гэрээ байхгүй байна</div>
        <p className="text-xs sm:text-sm text-gray-400">
          {party === "company"
            ? "\"Шинээр үүсгэх\" хэсгээс тэнцсэн ажил горилогчтой гэрээ байгуулна уу."
            : "Ажил олгогч танд гэрээ илгээхэд энд харагдана."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 bg-gray-50/50 p-3 sm:p-4 border border-gray-100 rounded-2xl sm:rounded-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <SearchInput
            key={clearCount}
            value={searchQuery}
            placeholder={party === "company" ? "Дугаар, ажилтан, албан тушаал..." : "Дугаар, компани, албан тушаал..."}
            onCommit={(q) => update({ q })}
          />
          <select value={sort} onChange={(e) => update({ sort: e.target.value === "new" ? null : e.target.value })} className={`${filterSelectClass} sm:w-56`} aria-label="Эрэмбэ">
            {(Object.keys(SORTS) as SortKey[]).map((key) => (
              <option key={key} value={key}>↕ {SORTS[key].label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LabeledSelect label="Төлөв" value={statusFilter} onChange={(e) => update({ status: e.target.value })}>
            <option value="all">Бүгд ({contracts.length})</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {CONTRACT_STATUS_LABELS[s]} ({contracts.filter((c) => c.status === s).length})
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect label="Албан тушаал" value={positionFilter} onChange={(e) => update({ position: e.target.value })}>
            <option value="all">Бүгд</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </LabeledSelect>
          <LabeledSelect label="Цалингийн төрөл" value={salaryTypeFilter} onChange={(e) => update({ stype: e.target.value })}>
            <option value="all">Бүгд</option>
            {(Object.keys(SALARY_TYPE_LABELS) as ContractSalaryType[]).map((t) => (
              <option key={t} value={t}>{SALARY_TYPE_LABELS[t]}</option>
            ))}
          </LabeledSelect>
          <DateRange label="Эхлэх огноо" from={startFrom} to={startTo} onChange={(changes) => update(changes)} />
        </div>
      </div>

      <ResultSummary total={contracts.length} filtered={filtered.length} hasFilters={hasFilters} onClear={clearFilters} />

      {filtered.length === 0 ? (
        <div className="p-10 bg-white border border-gray-100 rounded-3xl text-center text-gray-400 shadow-sm text-sm">
          Таны сонгосон шүүлтүүрт тохирох гэрээ байхгүй байна.
        </div>
      ) : (
        <>
          {/* 🖥️ КОМПЬЮТЕР */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-5">Гэрээ</th>
                  <th className="px-5 py-5">{party === "company" ? "Ажилтан" : "Ажил олгогч"}</th>
                  <th className="px-5 py-5">Цалин</th>
                  <th className="px-5 py-5">Хугацаа</th>
                  <th className="px-5 py-5">Төлөв</th>
                  <th className="px-6 py-5 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {paged.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openDetail(c)}
                    className={`hover:bg-gray-50/50 transition ${party === "company" ? "cursor-pointer" : ""}`}
                  >
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900">{c.position}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{c.contract_number}</div>
                    </td>
                    <td className="px-5 py-5 font-medium text-gray-700">{counterparty(c)}</td>
                    <td className="px-5 py-5 text-gray-600 whitespace-nowrap">{formatSalary(c.salary, c.salary_type)}</td>
                    <td className="px-5 py-5 text-gray-500 whitespace-nowrap" suppressHydrationWarning>
                      {formatDate(c.start_date)} — {c.end_date ? formatDate(c.end_date) : "Хугацаагүй"}
                    </td>
                    <td className="px-5 py-5">
                      <ContractStatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`${basePath}/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl transition inline-block"
                      >
                        {party === "staff" && c.status === "sent" ? "Унших & гарын үсэг" : "Дэлгэрэнгүй"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 УТАС */}
          <div className="block md:hidden space-y-3">
            {paged.map((c) => (
              <div
                key={c.id}
                onClick={() => (party === "company" ? openDetail(c) : router.push(`${basePath}/${c.id}`))}
                className="block bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{c.position}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{c.contract_number}</div>
                  </div>
                  <ContractStatusBadge status={c.status} />
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {party === "company" ? "👤" : "🏢"} {counterparty(c)}
                </div>
                <div className="text-xs text-gray-500 flex justify-between gap-2 pt-2 border-t border-gray-50" suppressHydrationWarning>
                  <span>💰 {formatSalary(c.salary, c.salary_type)}</span>
                  <span>📅 {formatDate(c.start_date)}</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            filteredJobsCount={filtered.length}
            totalPages={totalPages}
            isFiltering={false}
            currentPage={currentPage}
            visiblePages={visiblePageNumbers(currentPage, totalPages)}
            setCurrentPage={setPage}
          />
        </>
      )}

      {selected?.job_request_id && (
        <ApplicantDetailModal
          jobRequestId={selected.job_request_id}
          onClose={() => setSelected(null)}
          footer={
            <Link
              href={`${basePath}/${selected.id}`}
              className="text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition"
            >
              📑 Гэрээ нээх
            </Link>
          }
        />
      )}
    </div>
  )
}
