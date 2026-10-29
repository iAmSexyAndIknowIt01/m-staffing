"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/theme/ThemeToggle"

// Landing хуудасны section-ууд руу шилжих цэс. «Ажил хайх», «Ажилтан хайх» нь Hero/CTA-д товчоор байгаа тул энд оруулахгүй.
// id-тай нь landing дээрх section (идэвхтэйг тодруулна); «Бидний тухай» нь тусдаа /about хуудас.
const NAV_ITEMS: { label: string; href: string; id?: string }[] = [
  { label: "Яагаад MStaffing", href: "/#features", id: "features" },
  { label: "Тоон үзүүлэлт", href: "/#stats", id: "stats" },
  { label: "Хэрхэн ажилладаг", href: "/#howitworks", id: "howitworks" },
  { label: "Бидний тухай", href: "/about" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>(null)
  // Доош scroll хийсэн үед navbar нарийсч "island" хэлбэртэй болно
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Landing дээр дэлгэцийн дунд байгаа section-ийг цэсэнд тодруулна
  useEffect(() => {
    if (pathname !== "/") return
    const sections = NAV_ITEMS.flatMap((item) => (item.id ? [document.getElementById(item.id)] : [])).filter(
      (el): el is HTMLElement => !!el
    )
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
          else setActiveId((current) => (current === entry.target.id ? null : current))
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 transform-gpu animate-nav-in"
    >
      <div
        className={`mx-auto px-4 md:px-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled ? "max-w-275 pt-3" : "max-w-350 pt-4 md:pt-5"}`}
      >
        <div
          className={`${scrolled ? "md:shadow-[0_20px_60px_rgba(0,0,0,.12)]! md:bg-white/80!" : ""} transition-all duration-500 h-16 rounded-full px-5 md:px-6 flex items-center justify-between border border-gray-100 md:border-white/20 bg-white/95 md:bg-white/65 md:backdrop-blur-xl shadow-sm md:shadow-[0_20px_60px_rgba(255,120,0,.08)] will-change-transform`}
        >
          {/* LEFT */}
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-3"
          >
            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-linear-to-br from-orange-500 to-orange-300 flex items-center justify-center text-white font-black text-sm md:text-xl"
            >
              M
            </div>

            <div>
              <h1
                className="text-lg md:text-xl font-black leading-none"
              >
                <span className="text-orange-500">M</span>
                <span className="text-orange-500">Staffing</span>
              </h1>
              <p
                className="text-xs md:text-xs text-gray-400 mt-0.5"
              >
                Future of Work
              </p>
            </div>
          </Link>

          {/* CENTER - Компьютер дээр харагдана */}
          <nav
            className="hidden lg:flex items-center gap-8"
          >
            {NAV_ITEMS.map((item) => {
              const active = item.id ? pathname === "/" && activeId === item.id : pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  scroll={true}
                  aria-current={active ? (item.id ? "location" : "page") : undefined}
                  className={`relative text-[15px] transition after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-orange-500 after:transition-all hover:text-orange-500 hover:after:w-full ${
                    active ? "text-orange-500 after:w-full" : "text-gray-700 after:w-0"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* RIGHT */}
          <div
            className="flex items-center gap-3"
          >
            <ThemeToggle className="w-10 h-10 md:w-11 md:h-11 rounded-full grid place-items-center text-gray-700 hover:text-orange-500 hover:bg-gray-100 transition" />
            <Link href="/login">
              <button
                className="orange-btn btn-shine h-10 md:h-11 px-5 md:px-7 text-xs md:text-sm flex items-center justify-center active:scale-100 md:hover:scale-[1.03] transition"
              >
                Нэвтрэх
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}