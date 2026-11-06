"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

// Хөтчийн scrollbar нуугдсан тул (globals.css) хуудсыг хэр гүйлгэснийг дэлгэцийн дээд талд
// нимгэн улбар шар мөрөөр харуулна. Гүйлгэх зүйлгүй хуудсанд харагдахгүй.
export default function ScrollProgress() {
  const pathname = usePathname()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const bar = barRef.current
      if (!bar) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
      bar.style.transform = `scaleX(${progress})`
      bar.style.opacity = max > 0 ? "1" : "0"
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    // Өгөгдөл ачаалж дуусахад хуудасны өндөр өөрчлөгдөнө
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      observer.disconnect()
    }
  }, [pathname])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-100002 h-0.75">
      <div
        ref={barRef}
        className="h-full origin-left bg-linear-to-r from-orange-500 via-orange-400 to-amber-300 shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-opacity duration-300"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />
    </div>
  )
}
