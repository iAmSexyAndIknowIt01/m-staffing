import Link from "next/link"
import { ChevronRight, FileText, Mail, Phone, Scale, Users } from "lucide-react"
import Navbar from "@/components/landing/Navbar"
import Footer from "@/components/landing/Footer"
import { LegalArticles, LegalLoadError, getLegalRows, sectionId, type LegalTable } from "@/components/landing/LegalDocument"
import { SITE_CONTACT, SITE_NAME } from "@/lib/siteInfo"
import LegalToc from "./LegalToc"

interface LegalDocumentPageProps {
  table: LegalTable
  title: string
  description: string
}

// Үйлчилгээний нөхцөл, нууцлалын бодлогын нийтэд харагдах албан ёсны хуудас:
// толгой хэсэг (замын мөр, гарчиг, мета), хажуугийн агуулга, хуудас мэт баримтын бие, холбоо барих хэсэг
export default async function LegalDocumentPage({ table, title, description }: LegalDocumentPageProps) {
  const rows = await getLegalRows(table)
  const otherDoc = table === "mt_terms" ? { href: "/privacy", label: "Нууцлалын бодлого" } : { href: "/terms", label: "Үйлчилгээний нөхцөл" }

  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="bg-slate-50 print:bg-white">
        {/* ТОЛГОЙ */}
        <header className="border-b border-slate-200 bg-white pt-28 md:pt-36 pb-10 md:pb-12 print:pt-0">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <nav aria-label="Замын мөр" className="dash-in flex items-center gap-1.5 text-xs font-medium text-slate-400 print:hidden">
              <Link href="/" className="hover:text-slate-700">Нүүр</Link>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Хууль эрх зүй</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-slate-600" aria-current="page">{title}</span>
            </nav>

            <div className="mt-6">
              <div style={{ "--d": 100 } as React.CSSProperties} className="dash-in max-w-2xl">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                  <Scale className="w-4 h-4" aria-hidden="true" /> {SITE_NAME} · Хууль эрх зүйн баримт бичиг
                </p>
                <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-3 text-base leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>

            {/* Мета мэдээлэл */}
            <dl style={{ "--d": 240 } as React.CSSProperties} className="dash-in mt-8 grid grid-cols-1 sm:grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-sm">
              <div className="flex items-center gap-3 px-4 py-3">
                <FileText className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-slate-400">Баримтын төрөл</dt>
                  <dd className="font-medium text-slate-800">{title}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 sm:border-t-0 sm:border-l">
                <Users className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-slate-400">Хамрах хүрээ</dt>
                  <dd className="font-medium text-slate-800">Ажил хайгч, ажил олгогч</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 sm:border-t-0 sm:border-l">
                <Scale className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-slate-400">Нийт заалт</dt>
                  <dd className="font-medium text-slate-800 tabular-nums">{rows.length}</dd>
                </div>
              </div>
            </dl>
          </div>
        </header>

        {/* АГУУЛГА + БАРИМТ */}
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-10 md:py-14 print:p-0">
          {rows.length === 0 ? (
            <LegalLoadError />
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
              <aside className="hidden lg:block print:hidden">
                <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <LegalToc items={rows.map((row) => ({ id: sectionId(row), title: row.title }))} />
                </div>
              </aside>

              <article
                style={{ "--d": 300 } as React.CSSProperties}
                className="dash-in rounded-2xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none"
              >
                {/* Баримтын толгой */}
                <div className="border-b border-slate-200 px-6 py-6 md:px-10 md:py-8 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">{SITE_NAME} платформ</p>
                  <p className="mt-2 text-xl md:text-2xl font-bold uppercase tracking-wide text-slate-900">{title}</p>
                  <div className="mx-auto mt-4 h-px w-16 bg-orange-500" aria-hidden="true" />
                </div>

                <div className="px-6 py-8 md:px-10 md:py-10">
                  <LegalArticles rows={rows} />
                </div>

                {/* Холбоо барих */}
                <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-6 md:px-10 rounded-b-2xl">
                  <p className="text-sm font-semibold text-slate-900">Асуулт байна уу?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Энэхүү баримт бичигтэй холбоотой асуулт, санал хүсэлтээ доорх хаягаар илгээнэ үү.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {SITE_CONTACT.email && (
                      <a href={`mailto:${SITE_CONTACT.email}`} className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-orange-600">
                        <Mail className="w-4 h-4 text-orange-500" aria-hidden="true" /> {SITE_CONTACT.email}
                      </a>
                    )}
                    {SITE_CONTACT.phone && (
                      <a href={`tel:${SITE_CONTACT.phone}`} className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-orange-600">
                        <Phone className="w-4 h-4 text-orange-500" aria-hidden="true" /> {SITE_CONTACT.phone}
                      </a>
                    )}
                  </div>
                  <p className="mt-4 text-xs text-slate-400 print:hidden">
                    Мөн уншина уу:{" "}
                    <Link href={otherDoc.href} className="font-medium text-slate-600 underline-offset-4 hover:text-orange-600 hover:underline">
                      {otherDoc.label}
                    </Link>
                  </p>
                </div>
              </article>
            </div>
          )}
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </>
  )
}
