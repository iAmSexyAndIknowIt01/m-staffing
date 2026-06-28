"use client"

import { useState } from "react"
import Link from "next/link"

// Ажилтны замын өгөгдөл
const staffSteps = [
  {
    no: "01",
    title: "Профайл үүсгэх",
    desc: "Өөрийн ур чадвар, туршлагыг оруулж, хэдхэн секундэд бүртгүүлнэ.",
  },
  {
    no: "02",
    title: "Ажил хайх",
    desc: "Өөрийн байршил, цагт тохирох уян хатан ажлын зар харна.",
  },
  {
    no: "03",
    title: "Холбогдож тохирох",
    desc: "Ажил олгогчтой шууд чатлаж, ажлын нөхцөлөө тохиролцоно.",
  },
  {
    no: "04",
    title: "Ажил эхлэх & Цалин",
    desc: "Ажлаа найдвартай хийж, цалингаа түргэн шуурхай авна.",
  },
]

// Ажил олгогчийн замын өгөгдөл
const employerSteps = [
  {
    no: "01",
    title: "Ажлын зар тавих",
    desc: "Шаардлагатай ур чадвар, цалингийн саналаа оруулж зар үүсгэнэ.",
  },
  {
    no: "02",
    title: "Staff хайх & Сонгох",
    desc: "Системийн санал болгосон эсвэл хайлтаар илэрсэн ажилтныг сонгоно.",
  },
  {
    no: "03",
    title: "Гэрээ байгуулах",
    desc: "Сонгосон ажилтантайгаа апп-аар дамжуулан цахим гэрээ хийнэ.",
  },
  {
    no: "04",
    title: "Ажил удирдах",
    desc: "Ажилтны ирц, гүйцэтгэлийг хянаж, төлбөрийг хялбар шийднэ.",
  },
]

export default function CTA() {
  // Идэвхтэй табыг хадгалах төлөв (staff эсвэл employer)
  const [activeRole, setActiveRole] = useState<"staff" | "employer">("staff")

  // Сонгосон дүрээс хамаарч өгөгдлийг сонгох
  const currentSteps = activeRole === "staff" ? staffSteps : employerSteps

  return (
    <section id="howitworks" className="relative overflow-hidden py-16 md:py-35">
      {/* BG */}
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#fffaf6] to-white" />

      {/* GLOW */}
      <div className="hidden md:block absolute top-[10%] left-[10%] w-150 h-150 rounded-full bg-orange-300/10 blur-[150px]" />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.05] md:opacity-[0.09] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-size-[50px_50px] md:bg-size-[70px_70px]" />

      <div className="relative z-10 max-w-350 mx-auto px-4 md:px-6">
        <div className="rounded-4xl md:rounded-[44px] bg-white md:bg-white/65 md:backdrop-blur-xl border border-gray-100 md:border-white px-6 py-12 md:px-14 md:py-20 shadow-[0_20px_50px_rgba(0,0,0,.04)] md:shadow-[0_40px_120px_rgba(0,0,0,.06)]">
          
          {/* HEADER */}
          <div className="text-center">
            <div className="inline-flex rounded-full bg-gray-50 md:bg-white px-5 py-2 text-xs md:text-sm font-semibold shadow-xs border border-gray-100 uppercase">
              How MStaffing Works
            </div>

            <h2 className="mt-5 text-3xl md:text-6xl font-black leading-tight">
              Платформ хэрхэн <span className="orange-text">ажилладаг вэ?</span>
            </h2>

            {/* 🛠️ ROLE SWITCHER (ТАБ ЭЛЕМЕНТ) */}
            <div className="mt-10 flex justify-center">
              <div className="relative flex items-center p-1.5 bg-gray-100 rounded-full border border-gray-200 shadow-inner overflow-hidden">
                {/* Хөдөлгөөнт дэвсгэр */}
                <div
                  className={`absolute top-1.5 left-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-md transition-transform duration-300 ease-out ${
                    activeRole === "employer" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                
                {/* Ажилтны товчлуур */}
                <button
                  onClick={() => setActiveRole("staff")}
                  className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-200 ${
                    activeRole === "staff" ? "text-orange-600" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  👨‍💼 Ажилтан (Staff)
                </button>
                
                {/* Ажил олгогчийн товчлуур */}
                <button
                  onClick={() => setActiveRole("employer")}
                  className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors duration-200 ${
                    activeRole === "employer" ? "text-orange-600" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  🏢 Ажил олгогч
                </button>
              </div>
            </div>
            
            <p className="mt-8 text-sm md:text-lg text-gray-500 max-w-175 mx-auto leading-6 md:leading-7">
              {activeRole === "staff" 
                ? "Өөрт тааламжтай уян хатан ажил олж, карьераа өсгөх зам."
                : "Туршлагатай, найдвартай ажилтныг цаг алдалгүй олж, бизнестээ анхаарах зам."}
            </p>
          </div>

          {/* ROADMAP - Динамик өгөгдөл */}
          <div className="mt-12 md:mt-14 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-5 animate-fade-in">
            {currentSteps.map((step, index) => (
              <div key={step.title} className="relative text-center px-4">
                {/* LINE */}
                {index !== 3 && (
                  <div className="hidden md:block absolute top-8.5 left-[60%] w-full h-px bg-linear-to-r from-orange-300 to-transparent" />
                )}

                {/* STEP */}
                <div className="relative w-15 h-15 md:w-17 md:h-17 mx-auto rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center text-orange-500 font-black text-sm md:text-base">
                  {step.no}
                </div>

                <h3 className="mt-4 md:mt-5 text-lg md:text-xl font-black">
                  {step.title}
                </h3>

                <p className="mt-2 text-gray-500 leading-6 md:leading-7 text-xs md:text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* BUTTONS */}
          <div className="mt-10 md:mt-14 flex justify-center gap-4 flex-wrap">
            <Link href="/dashboard/staff/jobs" className="w-full sm:w-auto">
              <button className="orange-btn w-full sm:w-55 h-13.5 flex items-center justify-center text-sm md:text-base">
                Ажил Хайх
              </button>
            </Link>

            <Link href="/dashboard/company/applicants" className="w-full sm:w-auto">
              <button className="w-full sm:w-55 h-13.5 rounded-2xl text-gray-800 bg-gray-50 border border-gray-200 flex items-center justify-center text-sm md:text-base font-semibold backdrop-blur-none active:translate-y-0 hover:bg-white hover:text-gray-900 hover:border-orange-400/50 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300">
                Staff Хайх
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}