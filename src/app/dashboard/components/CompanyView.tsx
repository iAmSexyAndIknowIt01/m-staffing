"use client"

import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Inbox,
  Lightbulb,
  Loader2,
  Lock,
  Plus,
  Search,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getErrorMessage } from "@/lib/errors"
import { showAlert } from "@/components/common/AppDialog"
import EmptyState from "@/components/common/EmptyState"
import LoadingLayout from "@/components/common/LoadingLayout"

interface TipData {
  id: number
  title: string
  content: string
}

interface DashboardData {
  stats: {
    openJobsCount: number
    totalApplicantsCount: number
    interviewCount: number
  }
  subscription: {
    planName: string
    status: string
    jobLimit: number
    expiresAt: string
  }
  activeJobs: Array<{
    id: string
    title: string
    totalApplicants: number
    newApplicants: number
    status: string
    views: number
  }>
  recentApplicants: Array<{
    id: string
    name: string
    role: string
    time: string
    avatar: string | null
  }>
  tips: TipData[]
}

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard/company/applicants", label: "Ирсэн анкетууд", icon: Inbox },
  { href: "/dashboard/company/post-job", label: "Ажлын зарууд", icon: Briefcase },
  { href: "/dashboard/company/search-staff", label: "Ажилтан хайх", icon: Search },
  { href: "/dashboard/company/profile", label: "Компанийн профайл", icon: Building2 },
]

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  href,
}: {
  icon: LucideIcon
  tone: string
  label: string
  value: number
  hint: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl shadow-sm p-3.5 sm:p-5 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4 hover:border-orange-200 hover:shadow-md transition"
    >
      <span className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-2xl flex items-center justify-center ${tone}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 leading-snug">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="hidden sm:block text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>
    </Link>
  )
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 px-1">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700">
          {linkLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

export default function CompanyView() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTipIndex, setActiveTipIndex] = useState(0)
  const [checkingApproval, setCheckingApproval] = useState(false)
  const [now] = useState(() => new Date())

  const isFetched = useRef(false)

  useEffect(() => {
    async function fetchDashboardData() {
      if (isFetched.current) return
      isFetched.current = true

      try {
        const res = await fetch("/api/company/dashboard")
        if (!res.ok) throw new Error("Удирдлагын мэдээллийг татаж чадсангүй.")
        const result = await res.json()
        if (!result.success) throw new Error(result.error || "Алдаа гарлаа.")
        setData(result)
      } catch (err) {
        setError(getErrorMessage(err))
        isFetched.current = false
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Зарын жагсаалтын «Зар нэмэх»-тэй ижил: компани админаар баталгаажсан эсэхийг шалгана
  const handleAddJob = async () => {
    if (checkingApproval) return
    setCheckingApproval(true)
    try {
      const res = await fetch("/api/company/check-approval")
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Компанийн төлөв шалгахад алдаа гарлаа.")
      if (result.is_approved === "approved") {
        router.push("/dashboard/company/post-job/add")
      } else {
        showAlert("Таны компани админаар баталгаажаагүй байна. Админ баталгаажуулсны дараа зар оруулах боломжтой болно.", {
          tone: "warning",
          title: "Зар оруулах боломжгүй",
        })
      }
    } catch (err) {
      showAlert(getErrorMessage(err, "Сүлжээний алдаа гарлаа. Дахин оролдоно уу."), { tone: "error" })
    } finally {
      setCheckingApproval(false)
    }
  }

  if (loading) {
    return <LoadingLayout loading />
  }

  if (error || !data) {
    return (
      <div role="alert" className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
        {error || "Мэдээлэл олдсонгүй."}
      </div>
    )
  }

  const { stats, activeJobs, recentApplicants, subscription, tips = [] } = data
  const limit = Math.max(subscription.jobLimit, 0)
  const isLimitReached = stats.openJobsCount >= limit
  const limitPercent = limit > 0 ? Math.min((stats.openJobsCount / limit) * 100, 100) : 100
  const currentTip = tips[activeTipIndex]
  const newApplicantsTotal = activeJobs.reduce((sum, job) => sum + (job.newApplicants || 0), 0)

  const addJobButton = isLimitReached ? (
    <button
      type="button"
      onClick={() =>
        showAlert(`Таны ажлын байрны лимит (${subscription.jobLimit}) дүүрсэн байна. Шинэ зар оруулахын тулд багцаа ахиулна уу.`, {
          tone: "warning",
          title: "Лимит дүүрсэн",
        })
      }
      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-white/10 border border-white/15 text-slate-300 text-sm font-semibold"
    >
      <Lock className="w-4 h-4" /> Лимит дүүрсэн
    </button>
  ) : (
    <button
      type="button"
      onClick={handleAddJob}
      disabled={checkingApproval}
      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition disabled:opacity-70"
    >
      {checkingApproval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ажлын зар нэмэх
    </button>
  )

  return (
    <div className="animate-fade-in space-y-6 sm:space-y-8">
      {/* ТОЛГОЙ */}
      <section className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-4xl text-white shadow-xl shadow-slate-950/10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-slate-300">
            {now.getMonth() + 1} сарын {now.getDate()}, {WEEKDAYS[now.getDay()]} гараг
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Компанийн удирдлага</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
            {newApplicantsTotal > 0
              ? `Танай зарууд ${newApplicantsTotal} шинэ анкет хүлээн авсан байна.`
              : "Зар, анкет, багцаа эндээс удирдана."}
          </p>
        </div>
        {addJobButton}
      </section>

      {/* ЛИМИТ ДҮҮРСЭН АНХААРУУЛГА */}
      {isLimitReached && (
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-amber-900">Зарын лимит дүүрсэн байна</h2>
            <p className="text-sm text-amber-800/80 mt-0.5">
              Таны багцын {subscription.jobLimit} зарын лимит бүрэн ашиглагдсан. Шинэ зар нэмэхийн тулд багцаа ахиулна уу.
            </p>
          </div>
          <Link
            href="/dashboard/company/billing"
            className="shrink-0 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition"
          >
            <CreditCard className="w-4 h-4" /> Багц ахиулах
          </Link>
        </section>
      )}

      {/* ТОЙМ */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard
          icon={Briefcase}
          tone="bg-orange-50 text-orange-600"
          label="Нээлттэй ажлын байр"
          value={stats.openJobsCount}
          hint={`${limit} зарын лимитээс`}
          href="/dashboard/company/post-job"
        />
        <StatCard
          icon={Inbox}
          tone="bg-emerald-50 text-emerald-600"
          label="Ирсэн нийт анкет"
          value={stats.totalApplicantsCount}
          hint={newApplicantsTotal > 0 ? `${newApplicantsTotal} шинэ анкет` : "Бүх зарын анкет"}
          href="/dashboard/company/applicants"
        />
        <StatCard
          icon={CalendarCheck}
          tone="bg-sky-50 text-sky-600"
          label="Ярилцлагад урьсан"
          value={stats.interviewCount}
          hint="Ярилцлагын шатанд буй"
          href="/dashboard/company/applicants"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЗҮҮН */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* ИДЭВХТЭЙ ЗАРУУД */}
          <section>
            <SectionHeader
              title="Идэвхтэй зарууд"
              href={activeJobs.length > 0 ? "/dashboard/company/post-job" : undefined}
              linkLabel={`Бүгдийг үзэх (${activeJobs.length})`}
            />
            {activeJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Идэвхтэй ажлын байр алга"
                description="Ажлын зар нийтэлснээр тохирох ажилтнуудаас анкет хүлээн авч эхэлнэ."
              />
            ) : (
              <ul className="space-y-3">
                {activeJobs.slice(0, 4).map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/dashboard/company/post-job/${job.id}/applicants`}
                      className="group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 hover:border-orange-200 hover:shadow-md transition"
                    >
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition">{job.title}</h3>
                          {job.newApplicants > 0 && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-orange-600 text-white text-xs font-semibold">
                              {job.newApplicants} шинэ
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {job.totalApplicants} анкет
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5" /> {job.views} үзэлт
                          </span>
                        </div>
                      </div>
                      <span className="hidden sm:inline text-sm font-semibold text-orange-600">Анкетууд</span>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 shrink-0 transition" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* СҮҮЛД ИРСЭН АНКЕТ */}
          <section>
            <SectionHeader
              title="Сүүлд ирсэн анкетууд"
              href={recentApplicants.length > 0 ? "/dashboard/company/applicants" : undefined}
              linkLabel="Бүгдийг үзэх"
            />
            {recentApplicants.length === 0 ? (
              <EmptyState icon={Inbox} title="Ирсэн анкет алга" description="Шинэ анкет ирэхэд энд харагдана." />
            ) : (
              <ul className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden">
                {recentApplicants.map((applicant) => (
                  <li key={applicant.id}>
                    <Link
                      href={`/dashboard/company/applicants/profile/?id=${applicant.id}`}
                      className="group flex items-center gap-4 p-4 sm:px-5 hover:bg-gray-50 transition"
                    >
                      <span className="w-11 h-11 shrink-0 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {applicant.avatar ? (
                          <img src={applicant.avatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition">{applicant.name}</p>
                        <p className="text-sm text-gray-500 truncate">{applicant.role}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{applicant.time}</span>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 shrink-0 transition" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* БАРУУН */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          {/* БАГЦ */}
          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Одоогийн багц</p>
                <h2 className="text-lg font-bold text-gray-900">{subscription.planName}</h2>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  subscription.status === "Идэвхтэй" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                }`}
              >
                {subscription.status}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Зарын лимит</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {stats.openJobsCount} / {limit}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? "bg-red-500" : "bg-orange-500"}`}
                  style={{ width: `${limitPercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-gray-500">Дуусах огноо: <span className="font-medium text-gray-700">{subscription.expiresAt}</span></p>
            </div>

            <Link
              href="/dashboard/company/billing"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition"
            >
              <CreditCard className="w-4 h-4" /> Багц, төлбөр
            </Link>
          </section>

          {/* ШУУД ХОЛБООС */}
          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-2">
            <h2 className="px-3 pt-3 pb-2 text-sm font-semibold text-gray-900">Шууд холбоос</h2>
            <ul>
              {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition">
                    <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* ЗӨВЛӨГӨӨ */}
          <section className="bg-amber-50/70 border border-amber-100 rounded-3xl p-5">
            {currentTip ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">HR зөвлөгөө</span>
                  </div>
                  {tips.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveTipIndex((prev) => (prev + 1) % tips.length)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Дараагийнх
                    </button>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-sm text-gray-900">{currentTip.title}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed line-clamp-4">{currentTip.content}</p>
                <Link
                  href="/dashboard/company/tips"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  Бүх зөвлөгөө <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-sm text-gray-900">Асуух зүйл байна уу?</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  Зар нийтлэх, тохирох ажилтан хайхад тусламж хэрэгтэй бол бидэнтэй холбогдоорой.
                </p>
              </>
            )}
            <Link href="/dashboard/support" className="mt-3 block text-xs text-gray-500 hover:text-gray-700">
              Тусламж авах →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
