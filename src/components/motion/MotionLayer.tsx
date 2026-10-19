"use client"

import { useLayoutEffect } from "react"
import { usePathname } from "next/navigation"
import { prefersReducedMotion } from "@/components/landing/motion"

// Landing хуудасны хөнгөн Reveal (скроллоор доороос зөөлөн гарч ирэх)-ийг бусад
// бүх хуудсанд автоматаар нэмнэ. Хуудас бүрийг засах шаардлагагүй: DOM-оос карт,
// гарчгийг олж motion өгнө.
// Аль нэг элементэд motion хэрэггүй бол түүнд эсвэл эцэгт нь `data-no-motion` нэмнэ.

const CARD_TAGS = new Set(["DIV", "SECTION", "ARTICLE", "LI", "FORM", "A"])
const STAGGER_MS = 50
const MAX_STAGGER_MS = 300

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

    // Скроллоор гарч ирэх (Reveal) — дэлгэцэнд орсон дарааллаар ар араасаа
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
          }, 1000)
        })
      },
      // threshold 0: нэг пиксел ч дэлгэцэнд орвол харуулна. Хувиар (жишээ нь 0.12) өгвөл
      // дэлгэцээс хэд дахин өндөр карт (олон мөртэй хүснэгт) хэзээ ч тэр хувьд хүрэхгүй нуугдана
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
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
      })
    }

    // Хуудас солигдох / өгөгдөл ачаалагдах үед шинэ элементүүдийг барина.
    // MutationObserver microtask-аар ажиллах тул элемент зурагдахаас өмнө нуугдана (анивчихгүй)
    const mutationObserver = new MutationObserver(scan)
    scan()
    root.classList.remove("m-pending")
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      revealObserver.disconnect()
    }
  }, [isLanding])

  return null
}
