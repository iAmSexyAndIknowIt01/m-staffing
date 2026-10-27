"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users,
  Wallet,
} from "lucide-react"
import type { CompanyPublicJob } from "@/lib/companyJobs"

export interface CompanyProfileInfo {
  company_name: string
  email: string
  phone: string
  website: string
  tagline?: string
  description?: string
  industry?: string
  company_size?: string
  facebook_url?: string
  linkedin_url?: string
  logo_url?: string
}

interface Props {
  profile: CompanyProfileInfo
  jobs: CompanyPublicJob[]
  // Зар дээр дарахад очих хаяг. null бол зар дарагдахгүй
  jobHref?: ((jobId: string) => string) | null
  // Толгой хэсгийн баруун талд харуулах товч (жишээ нь "Мэдээлэл засах")
  actions?: ReactNode
}

const JOB_TYPE_LABELS: Record<string, string> = {
  fulltime: "Бүтэн цаг",
  parttime: "Хагас цаг",
  remote: "Зайнаас",
}

// "1500000" -> "1,500,000 ₮". Текст агуулсан бол ("Тохиролцоно" г.м.) хэвээр нь харуулна
function formatSalary(salary: string | null) {
  if (!salary) return "Тохиролцоно"
  if (!/^[\d\s,.]+₮?$/.test(salary.trim())) return salary
  return `${Number(salary.replace(/\D/g, "")).toLocaleString("en-US")} ₮`
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-800 break-words">{children}</div>
      </div>
    </div>
  )
}

const JOBS_PER_PAGE = 10

// Нээлттэй ажлын байрны жагсаалтын хуудаслалт: "1–10 / 23" + өмнөх/дараах + хуудасны дугаар
function JobsPagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / JOBS_PER_PAGE)
  if (totalPages <= 1) return null

  const from = (page - 1) * JOBS_PER_PAGE + 1
  const to = Math.min(page * JOBS_PER_PAGE, total)
  const btn = "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-lg border text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        {from}–{to} / нийт {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Өмнөх хуудас"
          className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${
              n === page ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Дараах хуудас"
          className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const Empty = () => <span className="text-slate-400 font-normal">Мэдээлэл оруулаагүй</span>

// Ажил хайгчид харагдах компанийн албан ёсны профайл (зөвхөн харах)
export default function CompanyProfileView({ profile, jobs, jobHref, actions }: Props) {
  const name = profile.company_name || "Компанийн нэр"
  const [jobsPage, setJobsPage] = useState(1)
  const totalJobPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE))
  // Жагсаалт өөрчлөгдөж хуудасны тоо багассан ч хоосон хуудас харуулахгүй
  const currentJobsPage = Math.min(jobsPage, totalJobPages)
  const visibleJobs = jobs.slice((currentJobsPage - 1) * JOBS_PER_PAGE, currentJobsPage * JOBS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* ТОЛГОЙ ХЭСЭГ */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-24 sm:h-28 bg-slate-900 relative">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-500" />
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 -mt-12 sm:-mt-14">
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm p-1.5 flex items-center justify-center">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={`${name} лого`} className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
              )}
            </div>

            {/* Нэр, товч бар хар зурвасны доор эхэлнэ (лого л зурвас руу давхцана) */}
            <div className="flex-1 min-w-0 sm:mt-16">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">{name}</h1>
              {profile.tagline && <p className="mt-1 text-sm sm:text-base text-slate-500">{profile.tagline}</p>}
            </div>

            {actions && <div className="sm:mt-16 shrink-0">{actions}</div>}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {profile.industry && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" /> {profile.industry}
              </span>
            )}
            {profile.company_size && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" /> {profile.company_size}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-700 hover:text-orange-600 transition"
              >
                <Globe className="w-4 h-4 text-slate-400" /> {displayUrl(profile.website)}
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЗҮҮН: ТАНИЛЦУУЛГА + НЭЭЛТТЭЙ АЖЛЫН БАЙР */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
            <h2 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-100">
              Байгууллагын танилцуулга
            </h2>
            {profile.description ? (
              <p className="text-[15px] leading-7 text-slate-700 whitespace-pre-wrap">{profile.description}</p>
            ) : (
              <p className="text-sm text-slate-400">Байгууллага танилцуулга оруулаагүй байна.</p>
            )}
          </section>

          <section id="company-jobs" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 scroll-mt-6">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Нээлттэй ажлын байр</h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{jobs.length}</span>
            </div>

            {jobs.length === 0 ? (
              <p className="py-6 text-sm text-slate-400">Одоогоор нээлттэй ажлын байр байхгүй байна.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visibleJobs.map((job) => {
                  const body = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{job.title}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          {job.job_type && (
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" /> {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {job.location || "Улаанбаатар"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Wallet className="w-3.5 h-3.5" /> {formatSalary(job.salary)}
                          </span>
                        </div>
                      </div>
                      <span className="hidden sm:block text-xs text-slate-400 shrink-0">{formatDate(job.created_at)}</span>
                      {jobHref && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-orange-500 transition" />}
                    </>
                  )

                  return (
                    <li key={job.id}>
                      {jobHref ? (
                        <Link href={jobHref(job.id)} className="group flex items-center gap-4 py-4 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-4 py-4">{body}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            <JobsPagination
              page={currentJobsPage}
              total={jobs.length}
              onChange={(next) => {
                setJobsPage(next)
                // Жагсаалтын эхлэл дэлгэцээс дээш гарсан бол түүн рүү буцааж гүйлгэнэ
                const section = document.getElementById("company-jobs")
                if (section && section.getBoundingClientRect().top < 0) {
                  section.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              }}
            />
          </section>
        </div>

        {/* БАРУУН: БАЙГУУЛЛАГЫН МЭДЭЭЛЭЛ, ХОЛБОО БАРИХ */}
        {/* Desktop дээр зүүн талын агуулгыг гүйлгэхэд байгууллагын мэдээлэл, холбоо барих картууд дээрээ тогтоно */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto no-scrollbar">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 pb-1">Байгууллагын мэдээлэл</h2>
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Үйл ажиллагааны чиглэл">
              {profile.industry || <Empty />}
            </InfoRow>
            <InfoRow icon={<Users className="w-4 h-4" />} label="Ажилтны тоо">
              {profile.company_size || <Empty />}
            </InfoRow>
            <InfoRow icon={<Globe className="w-4 h-4" />} label="Цахим хуудас">
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                  {displayUrl(profile.website)}
                </a>
              ) : (
                <Empty />
              )}
            </InfoRow>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 pb-1">Холбоо барих</h2>
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Имэйл">
              {profile.email ? (
                <a href={`mailto:${profile.email}`} className="hover:text-orange-600 transition">{profile.email}</a>
              ) : (
                <Empty />
              )}
            </InfoRow>
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Утас">
              {profile.phone ? (
                <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="hover:text-orange-600 transition">{profile.phone}</a>
              ) : (
                <Empty />
              )}
            </InfoRow>

            {(profile.facebook_url || profile.linkedin_url) && (
              <div className="pt-4 flex flex-wrap gap-2">
                {profile.facebook_url && (
                  <a
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    Facebook
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
