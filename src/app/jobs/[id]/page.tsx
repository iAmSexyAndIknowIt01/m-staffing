import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Briefcase, Calendar, Layers, MapPin, Wallet } from "lucide-react"
import Navbar from "@/components/landing/Navbar"
import Footer from "@/components/landing/Footer"
import { getPublicJob } from "@/lib/publicJob"
import { shortDescription } from "@/lib/publicJobFormat"

// Нэвтрэлтгүй үзэх зарын хуудас. Facebook зэрэгт хуваалцахад энэ хаяг явж,
// generateMetadata + opengraph-image.tsx нь урьдчилсан харагдацыг (гарчиг, зураг) өгнө.
type Props = { params: Promise<{ id: string }> }

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await getPublicJob(id)
  if (!job) return { title: "Зар олдсонгүй", robots: { index: false } }

  const title = `${job.title} - ${job.companyName}`
  const description =
    shortDescription(job.description) || `${job.companyName} · ${job.jobTypeLabel} · ${job.salaryText}`

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: {
      type: "website",
      url: `/jobs/${job.id}`,
      title: `${title} - MStaffing`,
      description,
      siteName: "MStaffing",
      locale: "mn_MN",
    },
    twitter: { card: "summary_large_image", title: `${title} - MStaffing`, description },
  }
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 grid place-items-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-800 break-words">{value}</p>
      </div>
    </div>
  )
}

function TextSection({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-gray-600">{text}</p>
    </section>
  )
}

export default async function PublicJobPage({ params }: Props) {
  const { id } = await params
  const job = await getPublicJob(id)
  if (!job) notFound()

  // Нэвтрээгүй бол нэвтрэх хуудас руу очиж, нэвтэрсний дараа энэ зар руу буцна (proxy ?next=)
  const applyHref = `/dashboard/staff/jobs/${job.id}`

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 pt-28 md:pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-5">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-600">Нээлттэй ажлын байр</p>

            <div className="mt-4 flex items-start gap-4">
              {job.companyLogoUrl ? (
                <img
                  src={job.companyLogoUrl}
                  alt={job.companyName}
                  width={64}
                  height={64}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border border-gray-100 object-contain bg-white shrink-0"
                />
              ) : (
                <span className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-orange-50 text-orange-600 grid place-items-center text-xl font-black shrink-0">
                  {job.companyName.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 break-words">{job.title}</h1>
                <p className="mt-1.5 text-base font-semibold text-orange-600">{job.companyName}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Fact icon={<Wallet className="w-5 h-5" />} label="Цалин" value={job.salaryText} />
              <Fact icon={<Briefcase className="w-5 h-5" />} label="Ажлын төрөл" value={job.jobTypeLabel} />
              <Fact icon={<MapPin className="w-5 h-5" />} label="Байршил" value={job.location} />
              <Fact icon={<Layers className="w-5 h-5" />} label="Ангилал" value={job.categoryLabel} />
              <Fact icon={<Calendar className="w-5 h-5" />} label="Нийтэлсэн" value={formatDate(job.createdAt)} />
            </div>

            <Link
              href={applyHref}
              className="orange-btn btn-shine mt-7 w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 text-sm md:text-base"
            >
              Анкет илгээх <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          <TextSection title="Ажлын үүрэг" text={job.description} />
          <TextSection title="Тавигдах шаардлага" text={job.requirements} />
        </div>
      </main>
      <Footer />
    </>
  )
}
