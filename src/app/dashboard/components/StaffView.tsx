"use client"

import {
  ArrowRight,
  Building2,
  ChevronRight,
  Eye,
  FileText,
  Lightbulb,
  MapPin,
  Search,
  Send,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import LoadingLayout from "@/components/common/LoadingLayout"
import EmptyState from "@/components/common/EmptyState"
import FoalLean from "@/components/common/FoalLean"
import HeroSkyline from "./HeroSkyline"
import CountUp from "@/components/landing/CountUp"
import { delay } from "./dashMotion"
import StatCard, { ARROW_HOVER, CARD_HOVER, ICON_HOVER } from "./DashStatCard"
import { getErrorMessage } from "@/lib/errors"
import { Progress, STATUS, toRequestStatus } from "@/components/staff/requests/requestStatus"
import { CompanyLogo, VerifiedCompanyName } from "@/components/staff/jobs/CompanyIdentity"

interface StaffViewProps {
  userId: string
}

interface Job {
  id: string
  company_id?: string
  title: string
  company: string
  company_logo?: string | null
  type: string
  location: string
  salary: string
  category: string
}

interface Application {
  id: string
  title: string
  company: string
  date: string
  status: string
}

interface DashboardData {
  stats: {
    appliedCount: number
    appliedThisWeek: string
    viewedCompaniesCount: number
    cvViewRate: string
  }
  profileProgress: number
  recommendedJobs: Job[]
  recentApplications: Application[]
  tips?: {
    title: string
    content: string
    detail_url: string
  }[]
}

const WEEKDAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"]

function greeting(date: Date) {
  const h = date.getHours()
  if (h < 5) return "Сайн байна уу"
  if (h < 12) return "Өглөөний мэнд"
  if (h < 18) return "Өдрийн мэнд"
  return "Оройн мэнд"
}

function formatSalary(salaryStr: string) {
  const numericValue = salaryStr?.replace(/[^0-9]/g, "")
  if (!numericValue) return salaryStr || "Тохиролцоно"
  return `${Number(numericValue).toLocaleString()} ₮`
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

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard/staff/jobs", label: "Ажил хайх", icon: Search },
  { href: "/dashboard/staff/requests", label: "Миний хүсэлтүүд", icon: Send },
  { href: "/dashboard/staff/profile", label: "Миний профайл", icon: UserRound },
  { href: "/dashboard/staff/cv", label: "Миний CV", icon: FileText },
]

export default function StaffView({ userId }: StaffViewProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(() => new Date())

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/staff/dashboard?userId=${userId}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Хянах самбарын мэдээллийг татаж чадсангүй.")
        setData(await res.json())
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

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

  const { stats, profileProgress, recommendedJobs, recentApplications, tips } = data
  const cvViews = Number(stats.cvViewRate.replace(/[^0-9]/g, "")) || 0
  const profileDone = profileProgress >= 100

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* МЭНДЧИЛГЭЭ */}
      <section className="dash-hero bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-4xl text-white shadow-xl shadow-slate-950/10 p-6 pb-20 sm:p-8 sm:pb-24 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <HeroSkyline />
        <div className="relative z-1">
          <p style={delay(200)} className="dash-in text-sm font-medium text-slate-300">
            {now.getMonth() + 1} сарын {now.getDate()}, {WEEKDAYS[now.getDay()]} гараг
          </p>
          <h1 style={delay(280)} className="dash-in mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">{greeting(now)}!</h1>
          <p style={delay(360)} className="dash-in mt-2 text-sm sm:text-base text-slate-300">
            {recommendedJobs.length > 0
              ? `Танд ${recommendedJobs.length} нээлттэй ажлын байр санал болгож байна.`
              : "Шинэ ажлын байр нэмэгдэхэд энд харагдана."}
          </p>
        </div>
        <div style={delay(440)} className="dash-in relative z-1">
        <FoalLean>
          <Link
            href="/dashboard/staff/jobs"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition"
          >
            <Search className="w-4 h-4" /> Ажил хайх
          </Link>
        </FoalLean>
        </div>
      </section>

      {/* ПРОФАЙЛ ДУУСГАХ САНАЛ */}
      {!profileDone && (
        <section style={delay(240)} className={`dash-in ${CARD_HOVER} hover:shadow-orange-500/10 bg-orange-50/70 border border-orange-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">Профайлаа бөглөж дуусгаарай</h2>
              <span className="text-sm font-bold text-orange-600">
                <CountUp value={`${profileProgress}%`} duration={1200} delay={600} />
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-orange-100 overflow-hidden">
              <div className="dash-bar h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${profileProgress}%`, ...delay(650) }} />
            </div>
            <p className="mt-2 text-sm text-gray-600">Бүрэн профайлтай ажил хайгч ажил олгогчдод илүү олон харагдаж, анкет илгээх боломжтой болно.</p>
          </div>
          <Link
            href="/dashboard/staff/profile"
            className="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition"
          >
            Профайл бөглөх <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* ТОЙМ */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard
          icon={Send}
          accent="orange"
          label="Илгээсэн анкет"
          value={stats.appliedCount}
          hint={stats.appliedThisWeek}
          href="/dashboard/staff/requests"
          delayMs={300}
        />
        <StatCard
          icon={Eye}
          accent="sky"
          label="CV-г тань үзсэн"
          value={cvViews}
          hint="Ажил олгогчид таны CV-г үзсэн тоо"
          href="/dashboard/staff/cv"
          delayMs={380}
        />
        <StatCard
          icon={Building2}
          accent="emerald"
          label="Танилцсан байгууллага"
          value={stats.viewedCompaniesCount}
          hint="Сүүлийн 7 хоногт үзсэн байгууллага"
          delayMs={460}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЗҮҮН */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* САНАЛ БОЛГОХ АЖИЛ */}
          <section style={delay(520)} className="dash-in">
            <SectionHeader
              title="Танд санал болгох ажил"
              href={recommendedJobs.length > 0 ? `/dashboard/staff/jobs/recommendedJobs?userId=${userId}` : undefined}
              linkLabel="Бүгдийг үзэх"
            />
            {recommendedJobs.length === 0 ? (
              <EmptyState
                compact
                illustration="walk"
                title="Санал болгох ажлын байр одоогоор алга"
                description="Шинэ ажлын байр нэмэгдэхэд энд харагдана."
                action={{ label: "Ажлын байр үзэх", href: "/dashboard/staff/jobs" }}
              />
            ) : (
              <ul className="space-y-3">
                {recommendedJobs.slice(0, 4).map((job, i) => (
                  <li key={job.id} style={delay(600 + i * 80)} className="dash-in">
                    <Link
                      href={`/dashboard/staff/jobs/${job.id}`}
                      className={`group flex items-center gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 hover:border-orange-200 ${CARD_HOVER}`}
                    >
                      <CompanyLogo name={job.company} logoUrl={job.company_logo} />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition">{job.title}</h3>
                        <VerifiedCompanyName name={job.company} className="text-sm mt-0.5" />
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            <Wallet className="w-3.5 h-3.5" /> {formatSalary(job.salary)}
                          </span>
                          {job.type && <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{job.type}</span>}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-300 group-hover:text-orange-500 shrink-0 ${ARROW_HOVER}`} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* СҮҮЛД ИЛГЭЭСЭН АНКЕТ */}
          <section style={delay(720)} className="dash-in">
            <SectionHeader
              title="Сүүлд илгээсэн анкет"
              href={recentApplications.length > 0 ? "/dashboard/staff/requests" : undefined}
              linkLabel="Бүгдийг үзэх"
            />
            {recentApplications.length === 0 ? (
              <EmptyState
                compact
                illustration="folder"
                title="Илгээсэн анкет алга"
                description="Сонирхсон ажлын байрандаа анкет илгээхэд явц нь энд харагдана."
              />
            ) : (
              <ul className="space-y-3">
                {recentApplications.slice(0, 3).map((app, i) => {
                  const status = toRequestStatus(app.status)
                  const info = STATUS[status]
                  const StatusIcon = info.icon
                  return (
                    <li key={app.id} style={delay(800 + i * 80)} className="dash-in">
                      <Link
                        href={`/dashboard/staff/requests/${app.id}`}
                        className={`group block bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 hover:border-orange-200 ${CARD_HOVER}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition">{app.title}</h3>
                            <p className="text-sm text-gray-500 truncate">
                              {app.company} · {app.date}
                            </p>
                          </div>
                          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${info.badge}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${ICON_HOVER}`} /> {info.label}
                          </span>
                        </div>
                        <div className="mt-3">
                          <Progress status={status} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* БАРУУН */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          {profileDone && (
            <section style={delay(560)} className={`dash-in group bg-white border border-gray-100 rounded-3xl shadow-sm p-5 hover:border-emerald-200 hover:shadow-emerald-500/10 ${CARD_HOVER}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Профайлын бүрэн байдал</h2>
                <span className="text-sm font-bold text-emerald-600">
                  <CountUp value="100%" duration={1200} delay={850} />
                </span>
              </div>
              <div style={delay(900)} className="dash-bar mt-3 h-2 rounded-full bg-emerald-500" />
              <p className="mt-2 text-xs text-emerald-600">Профайл бүрэн бөглөгдсөн байна.</p>
            </section>
          )}

          <section style={delay(640)} className={`dash-in bg-white border border-gray-100 rounded-3xl shadow-sm p-2 hover:border-orange-100 ${CARD_HOVER}`}>
            <h2 className="px-3 pt-3 pb-2 text-sm font-semibold text-gray-900">Шууд холбоос</h2>
            <ul>
              {QUICK_LINKS.map(({ href, label, icon: Icon }, i) => (
                <li key={href} style={delay(700 + i * 60)} className="dash-in">
                  <Link href={href} className="group flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 transition">
                    <span className={`w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center ${ICON_HOVER}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:text-orange-500 ${ARROW_HOVER}`} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {tips && tips.length > 0 && (
            <section className="space-y-3">
              {tips.map((tip, index) => (
                <article key={index} style={delay(820 + index * 90)} className={`dash-in group bg-amber-50/70 border border-amber-100 rounded-3xl p-5 hover:border-amber-200 hover:shadow-amber-500/10 ${CARD_HOVER}`}>
                  <div className="flex items-center gap-2">
                    <Lightbulb className={`w-5 h-5 text-amber-600 shrink-0 ${ICON_HOVER}`} />
                    <h3 className="font-semibold text-sm text-amber-900">{tip.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-amber-900/80 leading-relaxed line-clamp-4">{tip.content}</p>
                  <Link
                    href={tip.detail_url.startsWith("/") ? tip.detail_url : `/${tip.detail_url}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Үргэлжлүүлж унших <ChevronRight className="w-4 h-4" />
                  </Link>
                </article>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
