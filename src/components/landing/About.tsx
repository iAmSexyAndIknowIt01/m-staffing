import Reveal from "./Reveal"
import CountUp from "./CountUp"
import { JOB_CATEGORIES } from "@/lib/jobPost"
import { PLANS } from "@/lib/planCatalog"

const STATEMENTS = [
  {
    title: "Эрхэм зорилго",
    text: "Бид ажил хайгч бүрт өөрийн чадвар, цагийн хуваарьт тохирох ажлыг хурдан олох, байгууллага бүрт хэрэгцээтэй ажилтнаа цаг алдалгүй олох боломжийг ил тод, найдвартай платформоор дамжуулан бүрдүүлнэ.",
  },
  {
    title: "Алсын хараа",
    text: "Монголын ажил хайгчид болон ажил олгогчдын хамгийн итгэдэг ажлын байрны платформ болж, хүн бүр өөрт тохирох ажлыг хялбархан олдог, байгууллага бүр зөв хүнээ хурдан олдог ажлын зах зээлийг бий болгоно.",
  },
]

// Бүтээгдэхүүний бодит тоо (код дээрх тохиргооноос) — тохиргоо өөрчлөгдөхөд энд ч автоматаар шинэчлэгдэнэ
const FACTS = [
  { value: "0₮", label: "Ажил хайгчдад бүх үйлчилгээ үнэгүй" },
  { value: String(PLANS.free.jobLimit), label: "Байгууллагад үнэгүй зар нийтлэх эрх" },
  { value: String(JOB_CATEGORIES.length), label: "Ажлын ангилал" },
  { value: "1 жил", label: "Багцын эрхийн хүчинтэй хугацаа" },
]

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative bg-[#0b0b0d] py-20 md:py-32 overflow-hidden">
      <h2 id="about-title" className="sr-only">Бидний тухай</h2>
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="space-y-14 md:space-y-20">
          {STATEMENTS.map(({ title, text }, index) => (
            <Reveal key={title} delay={index * 120}>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 md:gap-16">
                <div>
                  <h3 className="text-3xl md:text-[2.75rem] font-black tracking-tight text-white leading-tight">{title}</h3>
                  <span className="mt-5 md:mt-7 block h-px w-16 bg-white/40" aria-hidden="true" />
                </div>
                <p className="text-base md:text-xl leading-8 md:leading-9 text-white/60">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 md:mt-24 border-t border-white/10 pt-10 md:pt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {FACTS.map(({ value, label }, index) => (
            <Reveal key={label} delay={index * 100}>
              <div className="border-l border-orange-500/40 pl-4 md:pl-5">
                <p className="text-3xl md:text-4xl font-black text-orange-500 tabular-nums">
                  <CountUp value={value} />
                </p>
                <p className="mt-2 text-xs md:text-sm text-white/50 leading-5">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
