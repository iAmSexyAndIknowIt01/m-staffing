"use client"

import { useRef, type PointerEvent, type ReactNode } from "react"
import { hasFinePointer, prefersReducedMotion } from "./motion"

type Props = {
  children: ReactNode
  className?: string
  // Хамгийн их хазайлт (градус)
  maxTilt?: number
}

// Хулганы байрлалаар 3D хазайдаг wrapper.
// --mx / --my CSS хувьсагчийг тохируулдаг тул доторх `.card-spotlight` гэрэл хулганыг дагана.
export default function TiltCard({ children, className = "", maxTilt = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== "mouse" || !hasFinePointer()) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    el.style.setProperty("--mx", `${x}px`)
    el.style.setProperty("--my", `${y}px`)

    if (prefersReducedMotion()) return

    const px = x / rect.width - 0.5
    const py = y / rect.height - 0.5

    el.style.transition = "transform 120ms ease-out"
    el.style.transform = `perspective(1000px) rotateX(${-py * maxTilt}deg) rotateY(${px * maxTilt}deg)`
  }

  const onPointerLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transition = "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)"
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
  }

  return (
    <div
      ref={ref}
      className={`h-full will-change-transform ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  )
}
