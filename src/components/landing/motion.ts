// Landing хуудасны motion-д хэрэглэгдэх жижиг туслах функцууд

// Хэрэглэгч "хөдөлгөөн багасгах" тохиргоо асаасан эсэх
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

// Хулгана ашиглаж буй төхөөрөмж эсэх (утсан дээр hover эффект ажиллуулахгүй)
export function hasFinePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  )
}
