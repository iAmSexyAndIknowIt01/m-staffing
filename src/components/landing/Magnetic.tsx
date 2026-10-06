"use client"

import { useRef, type PointerEvent, type ReactNode } from "react"
import { hasFinePointer, prefersReducedMotion } from "./motion"

type Props = {
  children: ReactNode
  className?: string
  // Хулгана руу хэр хүчтэй татагдах (0–1)
  strength?: number
}

// Хулгана ойртоход түүн рүү бага зэрэг татагддаг "соронзон" wrapper
export default function Magnetic({ children, className = "", strength = 0.3 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== "mouse" || !hasFinePointer() || prefersReducedMotion()) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * strength
    const y = (e.clientY - rect.top - rect.height / 2) * strength

    el.style.transition = "transform 150ms ease-out"
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  const onPointerLeave = () => {
    const el = ref.current
    if (!el) return
    // Буцахдаа бага зэрэг "үсрэх" spring мэдрэмжтэй
    el.style.transition = "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)"
    el.style.transform = "translate3d(0, 0, 0)"
  }

  return (
    <div
      ref={ref}
      className={`will-change-transform ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  )
}
