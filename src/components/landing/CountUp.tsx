"use client"

import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "./motion"

type Props = {
  // "10,000+", "100+", "24/7" гэх мэт — эхний тоог нь тоолж өсгөнө
  value: string
  duration?: number
  // Тоолж эхлэхээс өмнөх хүлээлт (ms) — карт гарч ирсний дараа тоолуулахад
  delay?: number
}

// easeOutExpo — эхэндээ хурдан, төгсгөлдөө зөөлөн удааширна
const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

// Дэлгэцэнд орж ирэхэд тоог 0-ээс эцсийн утга хүртэл тоолж өсгөнө
export default function CountUp({ value, duration = 1800, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const match = value.match(/^([\d,]+)(.*)$/)
    if (!el || !match || prefersReducedMotion()) return

    const target = Number(match[1].replace(/,/g, ""))
    const suffix = match[2]
    const format = (n: number) => n.toLocaleString("en-US") + suffix

    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    el.textContent = format(0)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        timer = setTimeout(() => {
          const start = performance.now()
          const tick = (now: number) => {
            // rAF-ийн хугацаа start-аас өмнө байж болох тул сөрөг утгаас («-0») сэргийлнэ
            const t = Math.min(Math.max((now - start) / duration, 0), 1)
            el.textContent = format(Math.round(target * ease(t)))
            if (t < 1) frame = requestAnimationFrame(tick)
          }
          frame = requestAnimationFrame(tick)
        }, delay)
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      el.textContent = value
    }
  }, [value, duration, delay])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  )
}
