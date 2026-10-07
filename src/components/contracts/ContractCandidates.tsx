"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type SetStateAction } from "react"
import LoadingLayout from "@/components/common/LoadingLayout"
import Pagination from "@/components/staff/jobs/Pagination"
import { getErrorMessage } from "@/lib/errors"
import ApplicantDetailModal from "./ApplicantDetailModal"
import { DateRange, LabeledSelect, ResultSummary, SearchInput, filterSelectClass } from "./FilterControls"
import { JOB_TYPE_LABELS, formatDate } from "./format"
import { useListParams, useRememberListQuery, visiblePageNumbers } from "./listState"

interface Candidate {
  id: string
  user_name: string
  job_title: string
  job_type: string
  location: string
  email: string
  phone: string
  created_at: string
}

const PAGE_SIZE = 10

const SORTS = {
  new: { label: "Шинэ анкет эхэндээ", compare: (a: Candidate, b: Candidate) => b.created_at.localeCompare(a.created_at) },
  old: { label: "Хуучин анкет эхэндээ", compare: (a: Candidate, b: Candidate) => a.created_at.localeCompare(b.created_at) },
  name_asc: { label: "Нэр: А → Я", compare: (a: Candidate, b: Candidate) => a.user_name.localeCompare(b.user_name, "mn") },
  name_desc: { label: "Нэр: Я → А", compare: (a: Candidate, b: Candidate) => b.user_name.localeCompare(a.user_name, "mn") },
}

type SortKey = keyof typeof SORTS

// URL-ийн түлхүүрүүд "Гэрээнүүд" табынхтай давхцахгүйн тулд "n_" угтвартай
const PREFIX = "n_"

async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch("/api/company/contracts/candidates")
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || "Мэдээлэл татахад алдаа гарлаа")
  return result.data || []
}

// Компанийн "Гэрээ" хуудасны "Шинээр үүсгэх" таб: тэнцсэн боловч гэрээгүй ажилтнууд.
// "Гэрээнүүд" табын ContractList-тэй ижил хэлбэрийн жагсаалт.
export default function ContractCandidates() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [clearCount, setClearCount] = useState(0)

  // Шүүлтүүр, эрэмбэ, хуудас URL-д хадгалагдана
  const { get, update } = useListParams(PREFIX)
  useRememberListQuery()
  const searchQuery = get("q")
  const jobFilter = get("job", "all")
  const jobTypeFilter = get("type", "all")
  const locationFilter = get("loc", "all")
  const appliedFrom = get("from")
  const appliedTo = get("to")
  const sort = (Object.hasOwn(SORTS, get("sort", "new")) ? get("sort", "new") : "new") as SortKey
  const page = Math.max(1, Number(get("page", "1")) || 1)
  const hasFilters = Boolean(searchQuery || appliedFrom || appliedTo) ||
    [jobFilter, jobTypeFilter, locationFilter].some((v) => v !== "all")

  const clearFilters = () => {
    update({ q: null, job: null, type: null, loc: null, from: null, to: null })
    setClearCount((n) => n + 1)
  }

  useEffect(() => {
    fetchCandidates()
      .then(setCandidates)
      .catch((err) => setError(getErrorMessage(err, "Серверийн алдаа гарлаа")))
      .finally(() => setLoading(false))
  }, [])

  const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort()
  const jobTitles = useMemo(() => unique(candidates.map((c) => c.job_title)), [candidates])
  const jobTypes = useMemo(() => unique(candidates.map((c) => c.job_type)), [candidates])
  const locations = useMemo(() => unique(candidates.map((c) => c.location)), [candidates])

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const result = candidates.filter((c) => {
      if (jobFilter !== "all" && c.job_title !== jobFilter) return false
      if (jobTypeFilter !== "all" && c.job_type !== jobTypeFilter) return false
      if (locationFilter !== "all" && c.location !== locationFilter) return false
      const applied = c.created_at.slice(0, 10)
      if (appliedFrom && applied < appliedFrom) return false
      if (appliedTo && applied > appliedTo) return false
      if (!query) return true
      return (
        c.user_name.toLowerCase().includes(query) ||
        c.job_title.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query)
      )
    })
    return result.sort(SORTS[sort].compare)
  }, [candidates, jobFilter, jobTypeFilter, locationFilter, appliedFrom, appliedTo, searchQuery, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const setPage = (next: SetStateAction<number>) =>
    update({ page: typeof next === "function" ? next(currentPage) : next })

  const handleCreate = async (jobRequestId: string) => {
    try {
      setCreatingId(jobRequestId)
      const res = await fetch("/api/company/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_request_id: jobRequestId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Гэрээ үүсгэж чадсангүй")

      router.push(`/dashboard/company/contracts/${result.data.id}`)
    } catch (err) {
      alert(getErrorMessage(err))
      setCreatingId(null)
    }
  }

  if (loading) return <LoadingLayout loading={true} />

  if (error) return <div className="p-6 bg-red-50 text-red-500 font-bold rounded-2xl">{error}</div>

  if (candidates.length === 0) {
    return (
      <div className="p-10 sm:p-16 bg-white border border-gray-100 rounded-3xl sm:rounded-4xl text-center text-gray-400 shadow-sm">
        <span className="text-3xl sm:text-4xl block mb-3">✅</span>
        <div className="font-bold text-gray-700 mb-1 text-sm sm:text-base">Шинээр үүсгэх гэрээ алга</div>
        <p className="text-xs sm:text-sm text-gray-400">
          Анкетууд хэсэгт ажил горилогчийг &quot;Тэнцсэн&quot; болгоход энд гарч ирнэ.
        </p>
      </div>
    )
  }

  const createButton = (c: Candidate, extraClass: string) => (
    <button
      onClick={(e) => {
        e.stopPropagation() // мөрийн дэлгэрэнгүй цонх нээгдэхгүй
        handleCreate(c.id)
      }}
      disabled={creatingId !== null}
      className={`text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition disabled:opacity-50 ${extraClass}`}
    >
      {creatingId === c.id ? "Үүсгэж байна..." : "📑 Гэрээ үүсгэх"}
    </button>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 bg-gray-50/50 p-3 sm:p-4 border border-gray-100 rounded-2xl sm:rounded-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <SearchInput
            key={clearCount}
            value={searchQuery}
            placeholder="Нэр, ажлын байр, имэйл, утас..."
            onCommit={(q) => update({ q })}
          />
          <select value={sort} onChange={(e) => update({ sort: e.target.value === "new" ? null : e.target.value })} className={`${filterSelectClass} sm:w-56`} aria-label="Эрэмбэ">
            {(Object.keys(SORTS) as SortKey[]).map((key) => (
              <option key={key} value={key}>↕ {SORTS[key].label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LabeledSelect label="Ажлын байр" value={jobFilter} onChange={(e) => update({ job: e.target.value })}>
            <option value="all">Бүгд ({candidates.length})</option>
            {jobTitles.map((title) => (
              <option key={title} value={title}>
                {title} ({candidates.filter((c) => c.job_title === title).length})
              </option>
            ))}
          </LabeledSelect>
          <LabeledSelect label="Ажлын цагийн төрөл" value={jobTypeFilter} onChange={(e) => update({ type: e.target.value })}>
            <option value="all">Бүгд</option>
            {jobTypes.map((t) => (
              <option key={t} value={t}>{JOB_TYPE_LABELS[t] || t}</option>
            ))}
          </LabeledSelect>
          <LabeledSelect label="Байршил" value={locationFilter} onChange={(e) => update({ loc: e.target.value })}>
            <option value="all">Бүгд</option>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </LabeledSelect>
          <DateRange label="Анкет ирсэн огноо" from={appliedFrom} to={appliedTo} onChange={(changes) => update(changes)} />
        </div>
      </div>

      <ResultSummary total={candidates.length} filtered={filtered.length} hasFilters={hasFilters} onClear={clearFilters} />

      {filtered.length === 0 ? (
        <div className="p-10 bg-white border border-gray-100 rounded-3xl text-center text-gray-400 shadow-sm text-sm">
          Таны сонгосон шүүлтүүрт тохирох ажил горилогч байхгүй байна.
        </div>
      ) : (
        <>
          {/* 🖥️ КОМПЬЮТЕР */}
          <div className="hidden md:block bg-white border border-gray-100 rounded-4xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-5">Ажил горилогч</th>
                  <th className="px-5 py-5">Ажлын байр</th>
                  <th className="px-5 py-5">Холбоо барих</th>
                  <th className="px-5 py-5">Анкет ирсэн</th>
                  <th className="px-6 py-5 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {paged.map((c) => (
                  <tr key={c.id} onClick={() => setSelectedId(c.id)} className="hover:bg-gray-50/50 transition cursor-pointer">
                    <td className="px-6 py-5 font-bold text-gray-900">{c.user_name}</td>
                    <td className="px-5 py-5">
                      <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-violet-100/50">
                        💼 {c.job_title}
                      </span>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                      <div className="text-gray-700 font-medium">{c.phone || "—"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{c.email}</div>
                    </td>
                    <td className="px-5 py-5 text-gray-500 whitespace-nowrap" suppressHydrationWarning>
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">{createButton(c, "px-3 py-2")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 УТАС */}
          <div className="block md:hidden space-y-3">
            {paged.map((c) => (
              <div key={c.id} onClick={() => setSelectedId(c.id)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 cursor-pointer">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{c.user_name}</div>
                    <div className="text-[11px] text-gray-400" suppressHydrationWarning>📅 {formatDate(c.created_at)}</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 truncate">💼 {c.job_title}</div>
                <div className="text-xs text-gray-500 space-y-0.5 pt-2 border-t border-gray-50">
                  {c.phone && <div>📞 {c.phone}</div>}
                  {c.email && <div className="truncate">✉️ {c.email}</div>}
                </div>
                {createButton(c, "w-full py-2.5")}
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

      {selectedId && (
        <ApplicantDetailModal
          jobRequestId={selectedId}
          onClose={() => setSelectedId(null)}
          footer={
            <button
              onClick={() => handleCreate(selectedId)}
              disabled={creatingId !== null}
              className="text-sm font-bold px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition disabled:opacity-50"
            >
              {creatingId === selectedId ? "Үүсгэж байна..." : "📑 Гэрээ үүсгэх"}
            </button>
          }
        />
      )}
    </div>
  )
}
