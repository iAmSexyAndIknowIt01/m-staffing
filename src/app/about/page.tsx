import type { Metadata } from "next"
import Link from "next/link"
import { Briefcase, Building2, FileText, ShieldCheck, SlidersHorizontal } from "lucide-react"
import PublicPageShell, { LegalSection } from "@/components/landing/PublicPageShell"
import { SITE_CONTACT, SITE_NAME } from "@/lib/siteInfo"
import { CONTRACTS_ENABLED } from "@/lib/features"

export const metadata: Metadata = {
  title: "Бидний тухай",
  description: `${SITE_NAME} — ажил хайгч болон ажил олгогчийг нэг дор холбох платформ.`,
}

const PILLARS = [
  { icon: Briefcase, title: "Ажил хайгчдад", text: "Профайл, CV-гээ нэг удаа бөглөөд тохирох ажлын байрнуудад хэдхэн товшилтоор анкет илгээнэ." },
  { icon: Building2, title: "Ажил олгогчдод", text: "Ажлын зар нийтэлж, ирсэн анкетуудыг нэг дор шүүж, тохирох ажилтнаа хайж олно." },
  CONTRACTS_ENABLED
    ? { icon: FileText, title: "Гэрээ, бичиг баримт", text: "Сонгосон ажилтантай хөдөлмөрийн гэрээг загвараас үүсгэж, системээр дамжуулан баталгаажуулна." }
    : { icon: SlidersHorizontal, title: "Ухаалаг шүүлтүүр", text: "Байршил, салбар, ажлын төрөл, цалингаар шүүж өөрт тохирох ажлын байрыг хурдан олно." },
  { icon: ShieldCheck, title: "Найдвартай орчин", text: "Бүртгэлийг имэйлээр баталгаажуулж, хувийн мэдээллийг зөвхөн ажилд зуучлах зорилгоор ашиглана." },
]


export default function AboutPage() {
  const contacts = [
    SITE_CONTACT.email && { label: "Имэйл", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}` },
    SITE_CONTACT.phone && { label: "Утас", value: SITE_CONTACT.phone, href: `tel:${SITE_CONTACT.phone.replace(/\s/g, "")}` },
    SITE_CONTACT.address && { label: "Хаяг", value: SITE_CONTACT.address },
  ].filter(Boolean) as { label: string; value: string; href?: string }[]

  return (
    <PublicPageShell
      eyebrow="Бидний тухай"
      title={`${SITE_NAME} гэж юу вэ?`}
      description="Монголын ажил хайгчид болон байгууллагуудыг илүү хурдан, ил тод, найдвартай холбох ажлын байрны нэгдсэн платформ."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PILLARS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-gray-500">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <LegalSection id="faq" title="Түгээмэл асуулт">
          <p>
            Бүртгэл, анкет, зар нийтлэх, багц, мэдэгдлийн талаарх асуултын хариултыг{" "}
            <Link href="/faq" className="font-semibold text-orange-600 hover:underline">Түгээмэл асуулт</Link> хуудаснаас үзнэ үү.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="Холбоо барих">
          {contacts.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {contacts.map((c) => (
                <div key={c.label} className="rounded-2xl border border-gray-100 p-5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</dt>
                  <dd className="mt-1 font-semibold text-gray-900 break-words">
                    {c.href ? <a href={c.href} className="hover:text-orange-600">{c.value}</a> : c.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p>
            Бүртгэлтэй хэрэглэгч системийн{" "}
            <Link href="/dashboard/support" className="font-semibold text-orange-600 hover:underline">Тусламж</Link>{" "}
            хэсгээс асуулт, санал хүсэлтээ илгээх боломжтой. Бид ажлын өдрүүдэд хариу өгнө.
          </p>
        </LegalSection>
      </div>
    </PublicPageShell>
  )
}
