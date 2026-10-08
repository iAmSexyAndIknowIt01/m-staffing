"use client"

import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "./motion"

type Props = {
  // "10,000+", "100+", "24/7" гэх мэт — эхний тоог нь тоолж өсгөнө
  value: string
  duration?: number
}

// easeOutExpo — эхэндээ хурдан, төгсгөлдөө зөөлөн удааширна
const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

// Дэлгэцэнд орж ирэхэд тоог 0-ээс эцсийн утга хүртэл тоолж өсгөнө
export default function CountUp({ value, duration = 1800 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const match = value.match(/^([\d,]+)(.*)$/)
    if (!el || !match || prefersReducedMotion()) return

    const target = Number(match[1].replace(/,/g, ""))
    const suffix = match[2]
    const format = (n: number) => n.toLocaleString("en-US") + suffix

    let frame = 0
    el.textContent = format(0)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          el.textContent = format(Math.round(target * ease(t)))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      el.textContent = value
    }
  }, [value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  )
}
