"use client"

import { useLayoutEffect } from "react"
import { usePathname } from "next/navigation"
import ScrollProgress from "@/components/landing/ScrollProgress"
import { hasFinePointer, prefersReducedMotion } from "@/components/landing/motion"

// Landing хуудасны motion (скроллоор гарч ирэх, хулгана дагах гэрэл, 3D хазайлт,
// тоо тоолж өсөх, scroll progress)-ийг бусад бүх хуудсанд автоматаар нэмнэ.
// Хуудас бүрийг засах шаардлагагүй: DOM-оос карт, гарчиг, тоог олж motion өгнө.
// Аль нэг элементэд motion хэрэггүй бол түүнд эсвэл эцэгт нь `data-no-motion` нэмнэ.

const CARD_TAGS = new Set(["DIV", "SECTION", "ARTICLE", "LI", "FORM", "A", "ASIDE"])
const STAGGER_MS = 70
const MAX_STAGGER_MS = 420

function classOf(el: Element) {
  return el.getAttribute("class") ?? ""
}

// Карт мэт харагдах (дугуй булантай, цагаан/шилэн дэвсгэр эсвэл сүүдэртэй) элемент эсэх
function isCardLike(el: Element) {
  if (!CARD_TAGS.has(el.tagName)) return false
  const cls = classOf(el)
  if (!/\brounded/.test(cls)) return false
  if (!/(\bbg-white\b|\bglass\b|\bshadow\b|\bshadow-(sm|md|lg|xl|2xl)\b)/.test(cls)) return false
  if (/\b(fixed|sticky|absolute)\b/.test(cls)) return false
  return true
}

// Modal, цэс, толгой хэсэг дотор motion өгөхгүй. Аль хэдийн reveal хийгдэх карт доторх
// элементэд давхар өгөхгүй (closest нь өөрийг нь ч шалгадаг тул эцгээс эхэлнэ)
function isExcluded(el: Element) {
  if (el.closest("[data-no-motion], nav, header, aside, footer, [role='dialog'], .fixed")) return true
  return Boolean(el.parentElement?.closest(".m-reveal"))
}

export default function MotionLayer() {
  const pathname = usePathname()
  const isLanding = pathname === "/"

  // Layout effect: элементүүдийг зурагдахаас өмнө нууж, анивчихаас сэргийлнэ
  useLayoutEffect(() => {
    const root = document.documentElement

    if (isLanding || prefersReducedMotion()) {
      root.classList.remove("m-pending")
      return
    }

    const seen = new WeakSet<Element>()

    // --- 1. Скроллоор гарч ирэх (Reveal) ---
    const revealObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)

        visible.forEach((entry, i) => {
          const el = entry.target as HTMLElement
          el.style.transitionDelay = `${Math.min(i * STAGGER_MS, MAX_STAGGER_MS)}ms`
          el.classList.add("is-visible")
          revealObserver.unobserve(el)
          // Animation дууссаны дараа delay-г цэвэрлэж hover transition-д саад болохгүй
          window.setTimeout(() => {
            el.style.transitionDelay = ""
          }, 1300)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )

    // --- 2. Тоо тоолж өсөх (CountUp) ---
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
    const countObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          countObserver.unobserve(entry.target)
          const node = entry.target.firstChild
          if (!node || node.nodeType !== Node.TEXT_NODE) continue

          const original = node.nodeValue ?? ""
          const match = original.match(/^(\d[\d,]*)(.*)$/)
          if (!match) continue
          const target = Number(match[1].replace(/,/g, ""))
          const useComma = match[1].includes(",")
          const suffix = match[2]
          const format = (n: number) => (useComma ? n.toLocaleString("en-US") : String(n)) + suffix

          // Тухайн text node-ийг шууд өөрчилнө — React дараа нь шинэчилбэл бид зогсоно
          let last = format(0)
          node.nodeValue = last
          const start = performance.now()
          const tick = (now: number) => {
            if (node.nodeValue !== last) return
            const t = Math.min((now - start) / 1400, 1)
            last = t === 1 ? original : format(Math.round(target * ease(t)))
            node.nodeValue = last
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )

    const scan = () => {
      const main = document.querySelector("body > main")
      if (!main) return

      // Карт болон гарчгууд
      main.querySelectorAll("[class*='rounded'], h1, h2").forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)

        // Effect дахин эхэлсэн үед (dev StrictMode, landing-аас буцах) өмнө нь
        // тэмдэглэгдсэн боловч хараахан гараагүй элементийг дахин ажиглана
        if (el.classList.contains("m-reveal")) {
          if (!el.classList.contains("is-visible")) revealObserver.observe(el)
          return
        }

        const isHeading = el.tagName === "H1" || el.tagName === "H2"
        if (!isHeading && !isCardLike(el)) return
        if (isExcluded(el)) return

        const rect = el.getBoundingClientRect()
        if (!isHeading && (rect.width < 120 || rect.height < 48)) return

        el.classList.add("m-reveal")
        revealObserver.observe(el)

        if (isHeading) return

        // Хулгана дагах гэрэл — position нь static биш, өөрийн ::after-гүй картад
        const position = getComputedStyle(el).position
        if (position !== "static" && !/\bafter:/.test(classOf(el))) {
          el.classList.add("m-spot")
        }
        // Холбоос карт дээр 3D хазайлт
        if (el.tagName === "A") el.classList.add("m-tilt")
      })

      // Том тоонууд (статистик)
      main.querySelectorAll("[class*='text-2xl'], [class*='text-3xl'], [class*='text-4xl'], [class*='text-5xl']").forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        if (el.childNodes.length !== 1 || el.firstChild?.nodeType !== Node.TEXT_NODE) return
        const text = el.textContent?.trim() ?? ""
        const match = text.match(/^(\d[\d,]*)/)
        if (!match || Number(match[1].replace(/,/g, "")) < 2) return
        countObserver.observe(el)
      })
    }

    // Хуудас солигдох / өгөгдөл ачаалагдах үед шинэ элементүүдийг барина.
    // MutationObserver microtask-аар ажиллах тул элемент зурагдахаас өмнө нуугдана (анивчихгүй)
    const mutationObserver = new MutationObserver(scan)
    scan()
    root.classList.remove("m-pending")
    root.classList.add("m-ready")
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    // --- 3. Хулгана дагах гэрэл ба 3D хазайлт ---
    let tilted: HTMLElement | null = null
    const resetTilt = () => {
      if (!tilted) return
      const el = tilted
      tilted = null
      el.style.transition = "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)"
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
      // Дууссаны дараа transform-ыг бүрэн арилгана (fixed modal-д нөлөөлөхгүй байх)
      window.setTimeout(() => {
        if (tilted !== el) {
          el.style.transform = ""
          el.style.transition = ""
        }
      }, 720)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !hasFinePointer()) return
      const target = e.target as Element | null

      const spot = target?.closest?.(".m-spot") as HTMLElement | null
      if (spot) {
        const rect = spot.getBoundingClientRect()
        spot.style.setProperty("--mx", `${e.clientX - rect.left}px`)
        spot.style.setProperty("--my", `${e.clientY - rect.top}px`)
      }

      const tilt = target?.closest?.(".m-tilt") as HTMLElement | null
      if (tilted && tilted !== tilt) resetTilt()
      if (!tilt) return
      tilted = tilt
      const rect = tilt.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      tilt.style.transition = "transform 120ms ease-out"
      tilt.style.transform = `perspective(1000px) rotateX(${-py * 4}deg) rotateY(${px * 4}deg)`
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true })
    document.addEventListener("pointerleave", resetTilt)

    return () => {
      root.classList.remove("m-ready")
      mutationObserver.disconnect()
      revealObserver.disconnect()
      countObserver.disconnect()
      document.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("pointerleave", resetTilt)
    }
  }, [isLanding])

  if (isLanding) return null
  return <ScrollProgress />
}
