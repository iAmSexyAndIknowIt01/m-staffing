"use client"

import { useEffect, useRef, type PointerEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import Magnetic from "./Magnetic"
import { hasFinePointer, prefersReducedMotion } from "./motion"

// Гарчгийн мөрүүд — үг бүр тусдаа blur-оос тодорч гарна
const headlineLines = [
  { words: ["Хүссэн", "үедээ"] },
  { words: ["ажилла."] },
  { words: ["Хэдхэн", "минутанд."], accent: true },
]

// Үг бүрийн animation delay-г урьдчилан тооцох (90ms зайтай дараалан)
let wordCount = 0
const headline = headlineLines.map((line) => ({
  ...line,
  words: line.words.map((text) => ({ text, delay: 200 + wordCount++ * 90 })),
}))

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Scroll parallax: зураг удаан, контент арай хурдан хөдөлж бүдгэрнэ
  useEffect(() => {
    if (prefersReducedMotion()) return

    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const h = window.innerHeight
      if (y > h * 1.2) return

      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`
      }
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${y * 0.18}px, 0)`
        contentRef.current.style.opacity = String(Math.max(0, 1 - y / (h * 0.75)))
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  // Хулганыг дагах гэрлийн туяа
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = sectionRef.current
    if (!el || e.pointerType !== "mouse" || !hasFinePointer()) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`)
    el.style.setProperty("--my", `${e.clientY - rect.top}px`)
  }

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      className="group/hero relative min-h-screen overflow-hidden pt-30"
    >
      {/* BG */}
      <div ref={bgRef} className="absolute inset-0 transform-gpu will-change-transform">
        <Image
          src="/hero-ub.png"
          alt="Ulaanbaatar"
          fill
          priority
          className="object-cover animate-ken-burns"
        />
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/55"
      />

      {/* Доороос цагаан руу зөөлөн шилжих — дараагийн хэсэгтэй уялдана */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/40 to-transparent" />

      {/* Хөвөх gradient бөмбөлгүүд — зөвхөн компьютер дээр */}
      <div className="hidden md:block absolute -top-20 -left-20 w-130 h-130 rounded-full bg-orange-500/25 blur-[120px] mix-blend-screen animate-orb" />
      <div className="hidden md:block absolute -bottom-30 -right-10 w-150 h-150 rounded-full bg-amber-400/15 blur-[140px] mix-blend-screen animate-orb [animation-delay:-7s]" />

      {/* Хулганыг дагах spotlight */}
      <div className="hero-spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/hero:opacity-100" />

      {/* CONTENT */}
      <div
        ref={contentRef}
        className="relative z-10 min-h-[calc(100vh-120px)] flex items-center justify-center px-4 transform-gpu will-change-transform"
      >
        <div
          className="max-w-225 mx-auto text-center"
        >
          <p
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-orange-400 tracking-[4px] font-bold text-xs animate-fade-up"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-orange-400" />
            </span>
            MONGOLIA • FUTURE OF WORK
          </p>

          <h1
            className="mt-6 text-4xl md:text-6xl font-black leading-tight text-white"
          >
            {headline.map((line, i) => (
              <span key={i} className="block">
                {line.words.map((word) => (
                  <span
                    key={word.text}
                    className={`inline-block mx-[0.12em] animate-word-in ${line.accent ? "text-orange-400" : ""}`}
                    style={{ animationDelay: `${word.delay}ms` }}
                  >
                    {word.text}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            className="mt-6 text-base md:text-xl leading-7 md:leading-8 text-white/90 max-w-175 mx-auto animate-fade-up [animation-delay:750ms]"
          >
            Монголын ажил хайгч болон ажил олгогчийг нэг платформ дээр хурдан
            бөгөөд найдвартай холбоно.
          </p>

          {/* BUTTONS */}
          <div
            className="mt-10 flex justify-center gap-4 flex-wrap animate-fade-up [animation-delay:900ms]"
          >
            <Magnetic className="w-full sm:w-auto">
              <Link href="/dashboard/staff/jobs" className="block">
                <button
                  className="orange-btn btn-shine w-full sm:w-55 h-13.5 flex items-center justify-center text-sm md:text-base"
                >
                  Ажил Хайх
                </button>
              </Link>
            </Magnetic>

            <Magnetic className="w-full sm:w-auto">
              <Link href="/dashboard/company/applicants" className="block">
                <button
                  className="w-full sm:w-55 h-13.5 rounded-2xl text-white bg-white/30 border border-white/20 flex items-center justify-center text-sm md:text-base backdrop-blur-none active:translate-y-0 hover:bg-white/95 hover:text-gray-900 hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.65)] transition-all duration-300"
                >
                  Staff Хайх
                </button>
              </Link>
            </Magnetic>
          </div>

          {/* STATS */}
          <div className="mt-16 flex justify-center gap-5 flex-wrap"></div>
        </div>
      </div>

      {/* SCROLL INDICATOR */}
      <a
        href="#features"
        aria-label="Доош гүйлгэх"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex h-11 w-7 justify-center rounded-full border-2 border-white/40 pt-2 animate-fade-up [animation-delay:1400ms] hover:border-white/80 transition-colors"
      >
        <span className="h-2 w-1 rounded-full bg-white animate-scroll-dot" />
      </a>
    </section>
  )
}
