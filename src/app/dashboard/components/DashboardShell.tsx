"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import LinkNext from "next/link"
import { Briefcase, Building2, ChevronLeft, FileSignature, FileText, LayoutDashboard, LogOut, Menu, PlusCircle, Search, Send, User, Users, X, type LucideIcon } from "lucide-react"
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
]

const COMPANY_NAV: NavItem[] = [
  { href: "/dashboard/company/search-staff", label: "Ажилтан хайх", icon: Search },
  { href: "/dashboard/company/post-job", label: "Зар нэмэх", icon: PlusCircle },
  { href: "/dashboard/company/applicants", label: "Анкетууд", icon: Users },
  { href: "/dashboard/company/profile", label: "Компанийн профайл", icon: Building2 },
  ...(CONTRACTS_ENABLED ? [{ href: "/dashboard/company/contracts", label: "Гэрээ", icon: FileSignature }] : []),
]

export default function DashboardShell({ userId, userRole, onLogout, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Хянах самбар", icon: LayoutDashboard },
    ...(userRole === "staff" ? STAFF_NAV : COMPANY_NAV),
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col lg:flex-row w-full relative">

      {/* 1. MOBILE NAVBAR */}
      <div className="lg:hidden sticky top-0 w-full h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50 shrink-0">
        <LinkNext
          href="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className="font-bold tracking-wide text-orange-500 hover:opacity-80 transition"
        >
          M-Staffing
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
        <div className="lg:hidden sticky top-16 w-full max-h-[calc(100dvh-4rem)] overflow-y-auto bg-white border-b border-gray-100 z-40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
                M-Staffing
              </LinkNext>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition mx-auto group border border-gray-200/50"
              title={isCollapsed ? "Цэс нээх" : "Цэс хаах"}
              aria-label={isCollapsed ? "Цэс нээх" : "Цэс хаах"}
            >
              {isCollapsed ? (
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
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
                  title={isCollapsed ? label : undefined}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 justify-center lg:justify-start ${
                    active
                      ? "bg-orange-50 text-orange-600 font-semibold shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-orange-600"
                  }`}
                >
                  <span className={`p-1.5 rounded-xl block transition-colors ${active ? "bg-orange-100/60 text-orange-600" : "text-gray-400"}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </span>
                  {!isCollapsed && <span className="text-sm truncate">{label}</span>}
                </LinkNext>
              )
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
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
          </div>
          <ThemeToggle
            withLabel={!isCollapsed}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition"
          />
          <button
            onClick={() => onLogout()}
            title={isCollapsed ? "Гарах" : undefined}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold text-red-500 bg-red-50/50 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Гарах</span>}
          </button>
        </div>
      </aside>

      {/* 3. ҮНДСЭН КОНТЕНТ */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-12 overflow-y-auto w-full flex flex-col">
        {children}
      </main>

    </div>
  )
}
