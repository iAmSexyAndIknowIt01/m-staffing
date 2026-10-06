"use client"

import { useEffect, useRef } from "react"

// Хуудасны дээд талд scroll хийсэн хэмжээг харуулах нимгэн зураас
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`
      }
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
  }, [])

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 z-60 h-0.75 origin-left scale-x-0 bg-linear-to-r from-orange-500 via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(255,122,0,.6)] pointer-events-none"
    />
  )
}
