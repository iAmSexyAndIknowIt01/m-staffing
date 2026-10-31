import { CalendarCheck, Eye, LayoutGrid, Megaphone, Target, Wallet, type LucideIcon } from "lucide-react"
import Reveal from "./Reveal"
import CountUp from "./CountUp"
import { JOB_CATEGORIES } from "@/lib/jobPost"
import { PLANS } from "@/lib/planCatalog"

const STATEMENTS: { index: string; icon: LucideIcon; title: string; text: string }[] = [
  {
    index: "01",
    icon: Target,
    title: "Эрхэм зорилго",
    text: "Бид ажил хайгч бүрт өөрийн чадвар, цагийн хуваарьт тохирох ажлыг хурдан олох, байгууллага бүрт хэрэгцээтэй ажилтнаа цаг алдалгүй олох боломжийг ил тод, найдвартай платформоор дамжуулан бүрдүүлнэ.",
  },
  {
    index: "02",
    icon: Eye,
    title: "Алсын хараа",
    text: "Монголын ажил хайгчид болон ажил олгогчдын хамгийн итгэдэг ажлын байрны платформ болж, хүн бүр өөрт тохирох ажлыг хялбархан олдог, байгууллага бүр зөв хүнээ хурдан олдог ажлын зах зээлийг бий болгоно.",
  },
]

// Бүтээгдэхүүний бодит тоо (код дээрх тохиргооноос) — тохиргоо өөрчлөгдөхөд энд ч автоматаар шинэчлэгдэнэ
const FACTS: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: Wallet, value: "0₮", label: "Ажил хайгчдад бүх үйлчилгээ үнэгүй" },
  { icon: Megaphone, value: String(PLANS.free.jobLimit), label: "Байгууллагад үнэгүй зар нийтлэх эрх" },
  { icon: LayoutGrid, value: String(JOB_CATEGORIES.length), label: "Ажлын ангилал" },
  { icon: CalendarCheck, value: "1 жил", label: "Багцын эрхийн хүчинтэй хугацаа" },
]

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-gray-50 py-20 md:py-32 overflow-hidden">
      {/* Өнгө нь цайвар/бараан горимд theme-dark.css-ээр солигдоно. Зөөлөн гэрэлтэлтийг утсан дээр гацахаас сэргийлж нууна */}
      <div className="hidden md:block absolute -top-40 right-[5%] w-140 h-140 rounded-full bg-orange-500/10 blur-[160px]" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <Reveal className="max-w-3xl">
          <span className="inline-flex rounded-full border border-gray-200 bg-white px-5 py-2 text-xs md:text-sm font-semibold text-orange-600">
            Бидний тухай
          </span>
          <h2 id="about-title" className="mt-6 text-3xl md:text-5xl font-black leading-tight tracking-tight text-gray-900">
            {/* Hero гарчигтай ижил гэрэлтэлт — үгийн бүлэг бүрийг дараалан хоцрооно */}
            <span className="text-shimmer-ink">Ажил хайгч, ажил олгогчийг</span>{" "}
            <span className="text-shimmer [animation-delay:320ms]">нэг дор</span>{" "}
            <span className="text-shimmer-ink [animation-delay:480ms]">холбоно</span>
          </h2>
          <p className="mt-5 text-base md:text-lg leading-8 text-gray-500">
            Цагийн болон бүтэн цагийн ажлыг хайх, нийтлэх, шалгаруулах бүх алхмыг нэг платформд нэгтгэж, хоёр талын цагийг хэмнэнэ.
          </p>
        </Reveal>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {STATEMENTS.map(({ index, icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 120} className="h-full">
              <article className="group relative h-full overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm p-7 md:p-9 transition-colors duration-500 hover:border-orange-300">
                <span
                  className="pointer-events-none absolute -right-2 -top-6 text-[7rem] md:text-[8.5rem] font-black leading-none text-orange-500/6 transition-colors duration-500 group-hover:text-orange-500/10 select-none"
                  aria-hidden="true"
                >
                  {index}
                </span>
                <span className="relative inline-flex w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/20">
                  <Icon className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
                </span>
                <h3 className="relative mt-6 text-2xl md:text-3xl font-black tracking-tight text-gray-900">{title}</h3>
                <p className="relative mt-4 text-[15px] md:text-lg leading-7 md:leading-8 text-gray-600">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <ul className="mt-5 md:mt-6 grid grid-cols-2 lg:grid-cols-4 rounded-[28px] border border-gray-100 bg-white shadow-sm divide-gray-100 max-lg:[&>li:nth-child(-n+2)]:border-b max-lg:[&>li:nth-child(odd)]:border-r lg:divide-x">
            {FACTS.map(({ icon: Icon, value, label }) => (
              <li key={label} className="flex flex-col gap-3 p-5 md:p-7 border-gray-100">
                <Icon className="w-5 h-5 text-orange-500" aria-hidden="true" />
                <p className="text-3xl md:text-4xl font-black text-gray-900 tabular-nums">
                  <CountUp value={value} />
                </p>
                <p className="text-xs md:text-sm leading-5 text-gray-500">{label}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
