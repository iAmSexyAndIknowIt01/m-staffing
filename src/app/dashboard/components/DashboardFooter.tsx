import Link from "next/link"
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react"
import { SITE_CONTACT, SITE_NAME } from "@/lib/siteInfo"

type FooterLink = { href: string; label: string }

// Хэрэглэгчийн төрлөөс хамаарсан шууд холбоос
const QUICK_LINKS: Record<"staff" | "company", FooterLink[]> = {
  staff: [
    { href: "/dashboard/staff/jobs", label: "Ажлын байрууд" },
    { href: "/dashboard/staff/requests", label: "Миний хүсэлтүүд" },
    { href: "/dashboard/staff/profile", label: "Миний профайл" },
    { href: "/dashboard/staff/cv", label: "Миний CV" },
  ],
  company: [
    { href: "/dashboard/company/post-job", label: "Ажлын зарууд" },
    { href: "/dashboard/company/applicants", label: "Ирсэн анкетууд" },
    { href: "/dashboard/company/search-staff", label: "Ажилтан хайх" },
    { href: "/dashboard/company/billing", label: "Багц, төлбөр" },
  ],
}

const HELP_LINKS: FooterLink[] = [
  { href: "/faq", label: "Түгээмэл асуулт хариулт" },
  { href: "/dashboard/support", label: "Тусламж авах" },
  { href: "/dashboard/terms", label: "Үйлчилгээний нөхцөл" },
  { href: "/dashboard/privacy", label: "Нууцлалын бодлого" },
]

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-400/90">{children}</h2>
}

function FooterLinkItem({ href, label }: FooterLink) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-sm text-white/80 transition-colors duration-200 hover:text-orange-400"
      >
        {label}
        <ArrowUpRight
          className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition duration-200 group-hover:opacity-100 group-hover:translate-x-0"
          aria-hidden="true"
        />
      </Link>
    </li>
  )
}

// Нэвтэрсний дараах (хянах самбарын) footer — системийн slate + улбар шар өнгө, баганатай холбоос, доод талд том нэр
export default function DashboardFooter({ role }: { role?: string }) {
  const quickLinks = QUICK_LINKS[role === "company" ? "company" : "staff"]
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto w-full shrink-0 overflow-hidden bg-slate-900 text-white">
      {/* Дэвсгэр: dashboard-ийн мэндчилгээний хэсэгтэй ижил slate gradient, брэндийн улбар шар гэрэлтэлт */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-40 -left-24 h-96 w-96 rounded-full bg-orange-500/15 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-6 pt-14 sm:pt-16 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          {/* Лого, товч тайлбар */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="" width={44} height={44} className="h-11 w-11 rounded-xl" />
              <span>
                <span className="block text-xl font-extrabold tracking-tight">{SITE_NAME}</span>
                <span className="block text-xs text-orange-300/80">Цаг бүр үнэ цэнэтэй</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Ажил хайгч, ажил олгогчийг нэг дор холбож, цагийн болон бүтэн цагийн ажлыг хурдан, найдвартай олоход тусална.
            </p>
          </div>

          {/* Холбоо барих */}
          <div className="col-span-2 lg:col-span-1">
            <ColumnTitle>Бидэнтэй холбогдох</ColumnTitle>
            <ul className="mt-5 space-y-3.5 text-sm text-white/80">
              {SITE_CONTACT.email && (
                <li>
                  <a href={`mailto:${SITE_CONTACT.email}`} className="inline-flex items-center gap-2.5 transition-colors hover:text-orange-400">
                    <Mail className="w-4 h-4 text-orange-400" aria-hidden="true" /> {SITE_CONTACT.email}
                  </a>
                </li>
              )}
              {SITE_CONTACT.phone && (
                <li>
                  <a href={`tel:${SITE_CONTACT.phone}`} className="inline-flex items-center gap-2.5 transition-colors hover:text-orange-400">
                    <Phone className="w-4 h-4 text-orange-400" aria-hidden="true" /> {SITE_CONTACT.phone}
                  </a>
                </li>
              )}
              {SITE_CONTACT.address && (
                <li className="inline-flex items-start gap-2.5">
                  <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-orange-400" aria-hidden="true" /> {SITE_CONTACT.address}
                </li>
              )}
            </ul>
          </div>

          {/* Тусламж */}
          <nav aria-label="Тусламж">
            <ColumnTitle>Тусламж</ColumnTitle>
            <ul className="mt-5 space-y-3.5">
              {HELP_LINKS.map((link) => (
                <FooterLinkItem key={link.href} {...link} />
              ))}
            </ul>
          </nav>

          {/* Шууд холбоос */}
          <nav aria-label="Шууд холбоос">
            <ColumnTitle>Шууд холбоос</ColumnTitle>
            <ul className="mt-5 space-y-3.5">
              {quickLinks.map((link) => (
                <FooterLinkItem key={link.href} {...link} />
              ))}
            </ul>
          </nav>
        </div>

        {/* Хуваах зураас, зохиогчийн эрх */}
        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/50">© {year} {SITE_NAME}. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Платформ төлөв</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.0.0
            </span>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-white/45">
          {SITE_NAME} нь Монголын ажил хайгч болон ажил олгогчдыг холбох цахим платформ юм. Энэхүү платформоор дамжуулан ажлын зар нийтлэх,
          ажилтан хайх, анкет илгээх, сонгон шалгаруулалтаа нэг дороос удирдах боломжтой.
        </p>

        {/* Доод талын том нэр — дээрээс доош бүдгэрнэ */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-4 select-none text-center font-black leading-[0.8] tracking-tighter bg-linear-to-b from-orange-400/45 via-orange-500/15 to-transparent bg-clip-text text-transparent text-[18vw] lg:text-[12.5rem] translate-y-[12%]"
        >
          {SITE_NAME}
        </div>
      </div>
    </footer>
  )
}
