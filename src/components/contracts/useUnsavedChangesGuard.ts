"use client"

import { useEffect, useRef, useState } from "react"

// Хадгалаагүй өөрчлөлттэй үед хуудаснаас гарахаас өмнө асууна:
// - хуудас сэргээх / хаах / өөр сайт руу гарах — browser-ийн beforeunload цонх
// - сайт доторх аливаа линк (цэс, "← Гэрээ" г.м.) — blocked=true болж өөрийн цонхоо харуулна;
//   proceed() дарвал тэр линкийг дахин дарж (өөрийн onClick-тэй нь) шилжинэ.
// App Router нь browser-ийн "буцах" товчийг зогсоох API-гүй тул тэр тохиолдлыг хамгаалахгүй.
export function useUnsavedChangesGuard(dirty: boolean) {
  const [pendingLink, setPendingLink] = useState<HTMLAnchorElement | null>(null)
  const bypassRef = useRef(false)

  useEffect(() => {
    if (!dirty) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }

    // Capture үе шатанд барьж авснаар Next.js Link-ийн onClick ажиллахаас өмнө зогсооно
    const onClick = (e: MouseEvent) => {
      if (bypassRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return

      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      e.preventDefault()
      e.stopPropagation()
      setPendingLink(link)
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [dirty])

  const proceed = () => {
    const link = pendingLink
    setPendingLink(null)
    if (!link) return
    bypassRef.current = true
    try {
      link.click()
    } finally {
      bypassRef.current = false
    }
  }

  const stay = () => setPendingLink(null)

  return { blocked: pendingLink !== null, proceed, stay }
}
