"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { ArrowUp } from "lucide-react"

// Бүх хуудсанд (root layout) тодорхой хэмжээгээр доош гүйлгэсний дараа баруун доод
// буланд гарч ирэх «дээш буцах» товч. Эргэн тойрны цагираг хуудсыг хэр гүйлгэснийг харуулна.
// Утсан дээр доод талд бэхлэгдсэн мөртэй хуудас (data-mobile-bottom-bar) байвал
// globals.css-ийн .scroll-to-top дүрмээр дээш зайлна.
const SHOW_AFTER = 480
const RADIUS = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ScrollToTop() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const ringRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress))
      }
      setVisible(window.scrollY > SHOW_AFTER)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [pathname])

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Хуудасны дээд хэсэг рүү буцах"
      title="Дээш буцах"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`scroll-to-top group fixed right-5 md:right-8 z-50 ${
        // Admin хуудсанд горим солих товч баруун доод буланд байдаг тул түүний дээр байрлана
        pathname.startsWith("/admin") ? "bottom-20" : "bottom-5 md:bottom-8"
      } w-13 h-13 rounded-full bg-white/90 backdrop-blur-md border border-orange-100 shadow-[0_10px_30px_rgba(255,122,0,.18)] grid place-items-center text-orange-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(255,122,0,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={RADIUS} fill="none" strokeWidth="2.5" className="stroke-orange-500/15" />
        <circle
          ref={ringRef}
          cx="26"
          cy="26"
          r={RADIUS}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-orange-500"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
      <ArrowUp className="relative w-5 h-5 transition-transform group-hover:-translate-y-0.5" strokeWidth={2.2} />
    </button>
  )
}
