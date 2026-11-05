"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import LinkNext from "next/link"
import { Briefcase, Building2, ChevronLeft, FileSignature, FileText, LayoutDashboard, LogOut, Menu, PlusCircle, Search, Send, Settings, User, Users, X, type LucideIcon } from "lucide-react"
import { CONTRACTS_ENABLED } from "@/lib/features"
import ThemeToggle from "@/components/theme/ThemeToggle"

interface DashboardShellProps {
  userId: string
  userRole: string
  onLogout: () => Promise<void>
  children: React.ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const STAFF_NAV: NavItem[] = [
  { href: "/dashboard/staff/jobs", label: "Ажлын байрууд", icon: Briefcase },
  { href: "/dashboard/staff/profile", label: "Миний профайл", icon: User },
  { href: "/dashboard/staff/cv", label: "Миний CV", icon: FileText },
  { href: "/dashboard/staff/requests", label: "Миний хүсэлт", icon: Send },
  ...(CONTRACTS_ENABLED ? [{ href: "/dashboard/staff/contracts", label: "Миний гэрээ", icon: FileSignature }] : []),
  { href: "/dashboard/staff/settings", label: "Тохиргоо", icon: Settings },
]

const COMPANY_NAV: NavItem[] = [
  { href: "/dashboard/company/search-staff", label: "Ажилтан хайх", icon: Search },
  { href: "/dashboard/company/post-job", label: "Зар нэмэх", icon: PlusCircle },
  { href: "/dashboard/company/applicants", label: "Анкетууд", icon: Users },
  { href: "/dashboard/company/profile", label: "Компанийн профайл", icon: Building2 },
  ...(CONTRACTS_ENABLED ? [{ href: "/dashboard/company/contracts", label: "Гэрээ", icon: FileSignature }] : []),
  { href: "/dashboard/company/settings", label: "Тохиргоо", icon: Settings },
]

// Хураалттай цэсэнд товчны нэрийг баруун талд нь гаргана (хулгана, гарын фокус)
function CollapsedTip({ show, label }: { show: boolean; label: string }) {
  if (!show) return null
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-60 ml-3 -translate-y-1/2 -translate-x-1 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  )
}

export default function DashboardShell({ userId, userRole, onLogout, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Хянах самбар", icon: LayoutDashboard },
    ...(userRole === "staff" ? STAFF_NAV : COMPANY_NAV),
  ]

  // Дэд хуудсууд (жишээ нь /post-job/[id]/applicants) дээр ч эх цэс нь идэвхтэй харагдана
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row w-full relative">

      {/* 1. MOBILE NAVBAR */}
      <div className="lg:hidden sticky top-0 w-full h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50 shrink-0">
        <LinkNext
          href="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className="font-bold tracking-wide text-orange-500 hover:opacity-80 transition"
        >
          MStaffing
        </LinkNext>

        <div className="flex items-center gap-1">
          <ThemeToggle className="p-2 rounded-xl text-gray-700 hover:bg-gray-50 transition" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Цэс хаах" : "Цэс нээх"}
            aria-expanded={mobileMenuOpen}
            className="p-2 rounded-xl focus:outline-none text-gray-700 hover:bg-gray-50 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden sticky top-16 w-full max-h-[calc(100dvh-4rem)] overflow-y-auto bg-white border-b border-gray-100 z-46 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="p-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <LinkNext
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${
                  isActive(href) ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                {label}
              </LinkNext>
            ))}

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onLogout()
              }}
              className="w-full flex items-center gap-3 text-left p-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.8} />
              Гарах
            </button>
          </nav>
        </div>
      )}

      {/* 2. DESKTOP SIDEMENU */}
      <aside
        className={`hidden lg:flex bg-white border-r border-gray-100 flex-col justify-between sticky top-0 h-screen p-4 transition-all duration-300 z-50 shrink-0 ${
          isCollapsed ? "w-22" : "w-64"
        }`}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2 py-2">
            {!isCollapsed && (
              <LinkNext href="/dashboard" className="text-base font-bold tracking-wide text-orange-500 animate-fade-in hover:opacity-80 transition">
                MStaffing
              </LinkNext>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-orange-200 hover:shadow-md hover:shadow-orange-500/10 flex items-center justify-center transition duration-300 mx-auto group border border-gray-200/50"
              title={isCollapsed ? "Цэс нээх" : "Цэс хаах"}
              aria-label={isCollapsed ? "Цэс нээх" : "Цэс хаах"}
            >
              {isCollapsed ? (
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm shadow-orange-500/20 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6">
                  <span className="text-white text-sm font-bold tracking-tighter leading-none select-none">
                    M
                  </span>
                </div>
              ) : (
                <ChevronLeft className="w-5 h-5 text-orange-500 group-hover:-translate-x-0.5 transition-transform duration-200" strokeWidth={2.5} />
              )}
            </button>
          </div>

          <nav className="space-y-2 flex flex-col">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <LinkNext
                  key={href}
                  href={href}
                  aria-label={isCollapsed ? label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ease-out justify-center lg:justify-start ${
                    active
                      ? "bg-orange-50 text-orange-600 font-semibold shadow-sm"
                      : "text-gray-500 hover:bg-orange-50/60 hover:text-orange-600 hover:shadow-sm"
                  }`}
                >
                  {/* Зүүн талын заагч: идэвхтэй үед байнга, бусад үед хулганаар очиход гарна */}
                  <span
                    aria-hidden="true"
                    className={`absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-orange-500 transition-transform duration-300 ease-out ${
                      active ? "scale-y-100" : "scale-y-0 group-hover:scale-y-75"
                    }`}
                  />
                  <span
                    className={`p-1.5 rounded-xl block transition duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 ${
                      active ? "bg-orange-100/60 text-orange-600" : "text-gray-400 group-hover:bg-white group-hover:text-orange-600 group-hover:shadow-sm"
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </span>
                  {!isCollapsed && <span className="text-sm truncate transition-transform duration-300 group-hover:translate-x-0.5">{label}</span>}
                  <CollapsedTip show={isCollapsed} label={label} />
                </LinkNext>
              )
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="group relative flex items-center gap-3 px-2">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 ring-2 ring-transparent ring-offset-2 ring-offset-white transition duration-300 ease-out group-hover:scale-105 group-hover:ring-orange-300 group-hover:shadow-lg group-hover:shadow-orange-500/30">
              {userRole === "staff" ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {userRole === "staff" ? "Ажил хайгч" : "Ажил олгогч"}
                </p>
                <p className="text-xs text-gray-400 font-mono truncate">ID: {userId.slice(0, 10)}</p>
              </div>
            )}
            <CollapsedTip show={isCollapsed} label={userRole === "staff" ? "Ажил хайгч" : "Ажил олгогч"} />
          </div>
          <ThemeToggle
            withLabel={!isCollapsed}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm transition duration-300 [&_svg]:transition-transform [&_svg]:duration-500 hover:[&_svg]:rotate-45 hover:[&_svg]:scale-110"
          />
          <button
            onClick={() => onLogout()}
            aria-label={isCollapsed ? "Гарах" : undefined}
            className="group relative w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold text-red-500 bg-red-50/50 hover:bg-red-50 hover:shadow-sm hover:shadow-red-500/10 transition duration-300"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            {!isCollapsed && <span className="truncate">Гарах</span>}
            <CollapsedTip show={isCollapsed} label="Гарах" />
          </button>
        </div>
      </aside>

      {/* 3. ҮНДСЭН КОНТЕНТ */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-12 overflow-x-clip w-full flex flex-col">
        {children}
      </main>

    </div>
  )
}
