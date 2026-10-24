"use client"

import { usePathname } from "next/navigation"
import ThemeToggle from "./ThemeToggle"

// Өөрийн цэсгүй хуудсууд (нэвтрэх, бүртгүүлэх, admin г.м.) дээр баруун дээд буланд
// горим солих товч. Dashboard болон landing өөрийн цэсэндээ товчтой тул энд харуулахгүй.
export default function FloatingThemeToggle() {
  const pathname = usePathname()
  if (pathname === "/" || pathname.startsWith("/dashboard")) return null

  // Admin хуудасны дээд талд navbar байгаа тул тэнд баруун доод буланд байрлуулна
  const position = pathname.startsWith("/admin") ? "bottom-6 right-6" : "top-4 right-4 sm:top-8 sm:right-8"

  return (
    <ThemeToggle
      className={`fixed ${position} z-40 w-11 h-11 rounded-full grid place-items-center bg-white/90 border border-gray-200 text-gray-700 shadow-sm backdrop-blur hover:text-orange-500 transition`}
    />
  )
}
