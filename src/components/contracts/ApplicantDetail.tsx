"use client"

import { useEffect, useState } from "react"
import { getErrorMessage } from "@/lib/errors"
import { JOB_TYPE_LABELS, formatDate } from "./format"

// Анкетын (tr_job_request) ажилтан + горилж буй ажлын байрны мэдээлэл.
// Гэрээний дэлгэрэнгүй хуудасны "Ажилтан", "Ажлын байр" табууд ашиглана.

export interface ApplicantProfile {
  full_name: string
  email: string
  phone: string
  bio: string
  avatar_url: string
  skills: { technical: string[]; languages: string[] }
  experience: { company: string; position: string; startDate: string; endDate: string; description: string }[]
  education: { school: string; degree: string; field: string; graduationYear: string; isCurrent?: boolean }[]
}

export interface ApplicantApplication {
  status: string
  created_at: string
  job: {
    title: string
    category: string | null
    job_type: string | null
    salary: string | null
    salary_type: string | null
    location: string | null
    description: string | null
    requirements: string | null
  } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  it: "Мэдээллийн технологи (IT)",
  finance: "Санхүү, Нягтлан бодох",
  marketing: "Маркетинг, Борлуулалт",
  hr: "Хүний нөөц, Удирдлага",
  design: "Дизайн, Креатив",
}

const JOB_SALARY_TYPE_LABELS: Record<string, string> = {
  monthly: "Сарын",
  hourly: "Цагийн",
  yearly: "Жилийн",
  negotiable: "Тохиролцоно",
}

async function fetchApplicant(jobRequestId: string) {
  const res = await fetch(`/api/company/staffprofile?id=${encodeURIComponent(jobRequestId)}`)
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || "Мэдээлэл татахад алдаа гарлаа")
  return { profile: result.profile as ApplicantProfile, application: result.application as ApplicantApplication | null }
}

// enabled=false үед татахгүй — дэлгэрэнгүй хуудсанд таб анх нээгдэх үед л татна
export function useApplicantDetail(jobRequestId: string | null | undefined, enabled = true) {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null)
  const [application, setApplication] = useState<ApplicantApplication | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shouldFetch = enabled && !!jobRequestId && !loaded

  useEffect(() => {
    if (!shouldFetch || !jobRequestId) return
    let cancelled = false
    fetchApplicant(jobRequestId)
      .then((result) => {
        if (cancelled) return
        setProfile(result.profile)
        setApplication(result.application)
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, "Серверийн алдаа гарлаа")))
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [shouldFetch, jobRequestId])

  return { profile, application, loading: !loaded, error }
}

export function ApplicantLoading() {
  return (
    <div className="py-16 flex justify-center">
      <div className="h-10 w-10 border-b-2 border-indigo-600 rounded-full animate-spin" />
    </div>
  )
}

export function ApplicantError({ message }: { message?: string | null }) {
  return <div className="p-4 bg-red-50 text-red-500 font-bold rounded-2xl text-sm">{message || "Мэдээлэл олдсонгүй."}</div>
}

// Ажилтны товч профайл
export function ApplicantProfileSection({ profile }: { profile: ApplicantProfile }) {
  const skills = [...profile.skills.technical, ...profile.skills.languages]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 shrink-0 bg-indigo-50 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-indigo-600">{profile.full_name.charAt(0) || "👤"}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-black text-gray-900 text-lg truncate">{profile.full_name}</div>
          <div className="text-xs text-gray-500 space-x-3">
            {profile.phone && <span>📞 {profile.phone}</span>}
            {profile.email && <span>✉️ {profile.email}</span>}
          </div>
        </div>
      </div>

      {profile.bio && (
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Танилцуулга</h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ур чадвар</h4>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold">{s}</span>
            ))}
          </div>
        </section>
      )}

      {profile.experience.length > 0 && (
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ажлын туршлага</h4>
          <ul className="space-y-2">
            {profile.experience.map((exp, i) => (
              <li key={i} className="text-sm">
                <div className="font-bold text-gray-800">{exp.position} · {exp.company}</div>
                <div className="text-xs text-gray-400">{exp.startDate} — {exp.endDate || "Одоог хүртэл"}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.education.length > 0 && (
        <section>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Боловсрол</h4>
          <ul className="space-y-2">
            {profile.education.map((edu, i) => (
              <li key={i} className="text-sm">
                <div className="font-bold text-gray-800">{edu.school}</div>
                <div className="text-xs text-gray-400">
                  {[edu.degree, edu.field].filter(Boolean).join(", ")} · {edu.isCurrent ? "Суралцаж байгаа" : edu.graduationYear}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// Горилж буй ажлын байр. full=true үед тайлбар, шаардлагыг таслахгүй бүтнээр нь харуулна.
export function ApplicantJobSection({ application, full = false }: { application: ApplicantApplication | null; full?: boolean }) {
  const job = application?.job
  if (!job) return <ApplicantError message="Ажлын байрны мэдээлэл олдсонгүй (зар устгагдсан байж болно)." />

  const clamp = full ? "" : "line-clamp-4"

  return (
    <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold text-violet-500 uppercase tracking-wider">Горилж буй ажлын байр</div>
          <div className="font-black text-gray-900 text-base mt-0.5">💼 {job.title}</div>
        </div>
        {application?.created_at && (
          <div className="text-[11px] text-gray-400 whitespace-nowrap" suppressHydrationWarning>
            Анкет: {formatDate(application.created_at)}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
        {job.category && <span className="px-2.5 py-1 rounded-lg bg-white border border-violet-100 text-gray-600">{CATEGORY_LABELS[job.category] || job.category}</span>}
        {job.job_type && <span className="px-2.5 py-1 rounded-lg bg-white border border-violet-100 text-gray-600">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>}
        {job.location && <span className="px-2.5 py-1 rounded-lg bg-white border border-violet-100 text-gray-600">📍 {job.location}</span>}
        {(job.salary || job.salary_type) && (
          <span className="px-2.5 py-1 rounded-lg bg-white border border-violet-100 text-gray-600">
            💰 {[job.salary, job.salary_type ? JOB_SALARY_TYPE_LABELS[job.salary_type] || job.salary_type : null].filter(Boolean).join(" / ")}
          </span>
        )}
      </div>
      {job.description && <p className={`text-xs text-gray-600 whitespace-pre-wrap ${clamp}`}>{job.description}</p>}
      {job.requirements && (
        <div>
          <div className="text-[11px] font-bold text-gray-500 mb-0.5">Шаардлага</div>
          <p className={`text-xs text-gray-600 whitespace-pre-wrap ${clamp}`}>{job.requirements}</p>
        </div>
      )}
    </div>
  )
}
