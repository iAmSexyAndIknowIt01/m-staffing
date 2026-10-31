import type { Metadata } from "next"
import Link from "next/link"
import PublicPageShell, { LegalSection } from "@/components/landing/PublicPageShell"
import { HAS_CONTACT_INFO, SITE_NAME } from "@/lib/siteInfo"
import { PAID_PLAN_TYPES, PLANS } from "@/lib/planCatalog"

export const metadata: Metadata = {
  title: "Түгээмэл асуулт",
  description: `${SITE_NAME}-ийн бүртгэл, анкет, зар нийтлэх, багц, мэдэгдлийн талаар түгээмэл асуудаг асуултууд.`,
}

const money = (n: number) => `${n.toLocaleString("en-US")}₮`

// Багцын үнэ, эрхийг тохиргооноос авна — үнэ өөрчлөгдөхөд хариулт ч шинэчлэгдэнэ
const planSummary = PAID_PLAN_TYPES.map((t) => `${PLANS[t].name} — ${PLANS[t].jobLimit} зар, ${money(PLANS[t].price)}`).join("; ")

const GROUPS: { id: string; title: string; items: { q: string; a: string }[] }[] = [
  {
    id: "general",
    title: "Ерөнхий",
    items: [
      {
        q: "Бүртгүүлэхэд төлбөр шаардлагатай юу?",
        a: `Ажил хайгчийн бүртгэл, анкет илгээх үйлчилгээ үнэгүй. Ажил олгогч ${PLANS.free.jobLimit} зар үнэгүй нийтэлж эхлээд, илүү олон зар нийтлэх шаардлагатай бол багц худалдаж авна.`,
      },
      {
        q: "Нууц үгээ мартсан бол яах вэ?",
        a: "Нэвтрэх хуудасны «Нууц үгээ мартсан уу?» холбоосоор бүртгэлтэй имэйл хаягтаа 6 оронтой сэргээх код авч, шинэ нууц үг тохируулна.",
      },
      {
        q: "Имэйл мэдэгдлийг хэрхэн тохируулах вэ?",
        a: "Нэвтэрсний дараа цэсний «Тохиргоо» хэсгээс аль үйл явдлын (анкетын төлөв, шинэ анкет, төлбөр г.м.) үед имэйл хүлээж авахаа асааж, унтраана.",
      },
    ],
  },
  {
    id: "staff",
    title: "Ажил хайгчдад",
    items: [
      {
        q: "Анкет илгээсний дараа юу болох вэ?",
        a: "Ажил олгогч таны профайл, CV-г хянаж үзнэ. Ярилцлагад урих, тэнцсэн эсвэл татгалзсан үед «Миний хүсэлт» хэсэгт төлөв шинэчлэгдэж, имэйлээр мэдэгдэнэ.",
      },
      {
        q: "Миний хувийн мэдээллийг хэн харах вэ?",
        a: "Таны профайлыг зөвхөн таны анкет илгээсэн, эсвэл ажилтан хайж буй бүртгэлтэй ажил олгогчид харна. Дэлгэрэнгүйг Нууцлалын бодлогоос үзнэ үү.",
      },
      {
        q: "Ажил олгогчид намайг хайж олохын тулд юу хийх вэ?",
        a: "Профайл хэсэгт «Цагийн ажилтан хайж байгаа ажил олгогчдод миний профайлыг ил тод харуулахыг зөвшөөрч байна» сонголтыг идэвхжүүлж, ур чадвар, туршлага, ажиллах боломжтой цагаа бөглөнө үү.",
      },
      {
        q: "Шинэ ажлын байрны мэдэгдэл авах боломжтой юу?",
        a: "Тийм. «Тохиргоо» хэсгээс «Шинэ ажлын санал»-ыг асааж, сонирхсон ангиллаа сонговол тухайн ангилалд шинэ зар нийтлэгдэхэд имэйлээр мэдэгдэнэ.",
      },
    ],
  },
  {
    id: "company",
    title: "Ажил олгогчдод",
    items: [
      {
        q: "Ажлын зарыг хэрхэн нийтлэх вэ?",
        a: "Ажил олгогчоор бүртгүүлж, байгууллага тань баталгаажсаны дараа «Зар нэмэх» хэсгээс ажлын байрны мэдээллээ оруулж нийтэлнэ.",
      },
      {
        q: "Багцууд ямар үнэтэй вэ?",
        a: `${planSummary}. Төлбөртэй багц худалдаж авсан өдрөөс хойш 1 жил хүчинтэй бөгөөд зар нийтлэх бүрт 1 эрх хасагдана.`,
      },
      {
        q: "Ирсэн анкетуудыг хаанаас харах вэ?",
        a: "«Анкетууд» хэсгээс бүх зарын анкетуудыг төлөв, ажлын байраар шүүж харж, ярилцлагад урих эсвэл татгалзах боломжтой. Шинэ анкет ирэхэд имэйлээр мэдэгдэнэ.",
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <PublicPageShell
      eyebrow="Тусламж"
      title="Түгээмэл асуулт"
      description={`${SITE_NAME}-ийг ашиглахтай холбоотой хамгийн их асуудаг асуултуудын хариулт.`}
    >
      <nav aria-label="Асуултын бүлэг" className="flex flex-wrap gap-2 mb-10">
        {GROUPS.map((g) => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="inline-flex h-9 items-center rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 transition"
          >
            {g.title}
          </a>
        ))}
      </nav>

      {GROUPS.map((group) => (
        <LegalSection key={group.id} id={group.id} title={group.title}>
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {group.items.map(({ q, a }) => (
              <details key={q} className="group p-5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-gray-900">
                  {q}
                  <span className="text-orange-600 transition group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </LegalSection>
      ))}

      <div className="mt-10 rounded-2xl bg-orange-50/70 border border-orange-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Хариултаа олсонгүй юу?</p>
          <p className="mt-1 text-sm text-gray-600">
            {HAS_CONTACT_INFO
              ? "Бидэнтэй холбогдвол ажлын өдрүүдэд хариу өгнө."
              : "Нэвтэрч «Тусламж» хэсгээс асуултаа илгээвэл ажлын өдрүүдэд хариу өгнө."}
          </p>
        </div>
        <Link
          href={HAS_CONTACT_INFO ? "/about#contact" : "/dashboard/support"}
          className="shrink-0 inline-flex h-11 items-center justify-center rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700 transition"
        >
          {HAS_CONTACT_INFO ? "Холбоо барих" : "Тусламж хүсэх"}
        </Link>
      </div>
    </PublicPageShell>
  )
}
