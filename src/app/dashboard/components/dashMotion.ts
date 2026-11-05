import type { CSSProperties } from "react"

// Dashboard нүүрний animation-ийн хоцрогдол (ms) — globals.css-ийн .dash-in, .dash-pop, .dash-bar ашиглана
export const delay = (ms: number) => ({ "--d": ms }) as CSSProperties
