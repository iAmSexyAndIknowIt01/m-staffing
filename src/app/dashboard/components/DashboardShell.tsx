"use client"

import { useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import LinkNext from "next/link"
import {
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  FileSignature,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Send,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { CONTRACTS_ENABLED } from "@/lib/features"

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
  { href: "/dashboard/staff/profile", label: "Миний Профайл", icon: UserRound },
  { href: "/dashboard/staff/cv", label: "Миний CV", icon: FileText },
  { href: "/dashboard/staff/requests", label: "Миний хүсэлт", icon: Send },
  ...(CONTRACTS_ENABLED
    ? [{ href: "/dashboard/staff/contracts", label: "Миний гэрээ", icon: FileSignature }]
    : []),
]

const COMPANY_NAV: NavItem[] = [
  { href: "/dashboard/company/search-staff", label: "Ажилтан хайх", icon: Search },
  { href: "/dashboard/company/post-job", label: "Зар нэмэх", icon: CirclePlus },
  { href: "/dashboard/company/applicants", label: "Анкетууд", icon: Users },
  { href: "/dashboard/company/profile", label: "Компани профайл", icon: Building2 },
  ...(CONTRACTS_ENABLED
    ? [{ href: "/dashboard/company/contracts", label: "Гэрээ", icon: FileSignature }]
    : []),
]

// Sidebar хураасан эсэхийг localStorage-д санах жижиг store (SSR дээр хураасан)
const COLLAPSE_KEY = "mstaffing:sidebar-collapsed"
const COLLAPSE_EVENT = "mstaffing:sidebar"
let collapsedMemory: boolean | null = null

function readCollapsed() {
  if (collapsedMemory === null) {
    try {
      collapsedMemory = localStorage.getItem(COLLAPSE_KEY) !== "0"
    } catch {
      collapsedMemory = true
    }
  }
  return collapsedMemory
}

function writeCollapsed(value: boolean) {
  collapsedMemory = value
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0")
  } catch {}
  window.dispatchEvent(new Event(COLLAPSE_EVENT))
}

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange)
  return () => window.removeEventListener(COLLAPSE_EVENT, onChange)
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#ff7a00] via-[#ff4f81] to-[#6c5cff] font-display text-sm font-extrabold text-white shadow-[0_0_24px_-4px_rgba(255,106,0,0.7)]">
        M
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
      </span>
      {!compact && (
        <span className="font-display text-[13px] font-bold tracking-[0.18em] text-white">
          MSTAFFING
        </span>
      )}
    </span>
  )
}

export default function DashboardShell({ userId, userRole, onLogout, children }: DashboardShellProps) {
  const isCollapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleCollapsed = () => writeCollapsed(!isCollapsed)

  const items: NavItem[] = [
    { href: "/dashboard", label: "Хянах самбар", icon: LayoutDashboard },
    ...(userRole === "staff" ? STAFF_NAV : COMPANY_NAV),
  ]

  // Дэд хуудсанд байхад ч эцэг цэс идэвхтэй харагдана
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const roleLabel = userRole === "staff" ? "Ажил Хайгч" : "Ажил Олгогч"
  const RoleIcon = userRole === "staff" ? UserRound : Building2

  return (
    <div className="aurora-bg relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Арын нарийн тор */}
      <div className="grid-overlay pointer-events-none fixed inset-0 z-0" aria-hidden />

      {/* 1. MOBILE NAVBAR */}
      <div className="glass-dark sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between px-4 lg:hidden">
        <LinkNext href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="transition hover:opacity-80">
          <Logo />
        </LinkNext>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Цэс хаах" : "Цэс нээх"}
          aria-expanded={mobileMenuOpen}
          className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="glass-dark animate-slide-down sticky top-16 z-40 max-h-[calc(100dvh-4rem)] w-full overflow-y-auto border-t border-white/5 shadow-2xl lg:hidden">
          <nav className="space-y-1 p-3">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <LinkNext
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`size-5 ${active ? "text-[#ff9a3d]" : ""}`} strokeWidth={1.8} />
                  {label}
                </LinkNext>
              )
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onLogout()
              }}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-rose-300 transition hover:bg-rose-500/10"
            >
              <LogOut className="size-5" strokeWidth={1.8} />
              Гарах
            </button>
          </nav>
        </div>
      )}

      {/* 2. DESKTOP SIDEMENU */}
      <aside
        className={`sticky top-0 z-50 hidden h-screen shrink-0 p-3 transition-[width] duration-500 ease-out-expo lg:flex ${
          isCollapsed ? "w-24" : "w-72"
        }`}
      >
        <div className="glass-dark relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[28px] px-4 py-5 shadow-[0_30px_80px_-30px_rgba(10,11,20,0.7)]">
          {/* Sidebar доторх гэрэлтэлт */}
          <div className="pointer-events-none absolute -top-24 -left-16 size-56 rounded-full bg-[#ff7a00]/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-16 size-56 rounded-full bg-[#6c5cff]/25 blur-3xl" aria-hidden />

          <div className="relative space-y-8">
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
              <LinkNext href="/dashboard" className="transition hover:opacity-85" title="Хянах самбар">
                <Logo compact={isCollapsed} />
              </LinkNext>
              {!isCollapsed && (
                <button
                  onClick={toggleCollapsed}
                  className="grid size-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
                  title="Меню хаах"
                  aria-label="Меню хаах"
                >
                  <ChevronsLeft className="size-4" />
                </button>
              )}
            </div>

            {!isCollapsed && (
              <p className="px-3 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
                Navigation
              </p>
            )}

            <nav className="-mt-4 flex flex-col gap-1.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <LinkNext
                    key={href}
                    href={href}
                    title={isCollapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group/nav relative flex items-center gap-3 rounded-2xl p-3 text-sm transition-all duration-300 ${
                      isCollapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "nav-active-glow font-semibold text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`size-5 shrink-0 transition-transform duration-300 group-hover/nav:scale-110 ${
                        active ? "text-[#ff9a3d] drop-shadow-[0_0_8px_rgba(255,122,0,0.8)]" : ""
                      }`}
                      strokeWidth={1.8}
                    />
                    {!isCollapsed && <span className="truncate">{label}</span>}

                    {/* Хураасан үед хажууд гарах tooltip */}
                    {isCollapsed && (
                      <span className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-lg bg-[#11131f] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 -translate-x-1 group-hover/nav:translate-x-0 group-hover/nav:opacity-100">
                        {label}
                      </span>
                    )}
                  </LinkNext>
                )
              })}
            </nav>
          </div>

          <div className="relative space-y-3">
            {isCollapsed && (
              <button
                onClick={toggleCollapsed}
                className="mx-auto grid size-10 place-items-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
                title="Меню нээх"
                aria-label="Меню нээх"
              >
                <ChevronsRight className="size-4" />
              </button>
            )}

            <div
              className={`flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-2.5 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative grid size-10 min-w-10 place-items-center rounded-xl bg-linear-to-br from-white/15 to-white/5 text-white ring-1 ring-white/10">
                <RoleIcon className="size-5" strokeWidth={1.8} />
                <span className="neon-dot absolute -right-0.5 -bottom-0.5 size-2.5! ring-2 ring-[#0c0d18]" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{roleLabel}</p>
                  <p className="truncate font-mono text-[10px] text-white/40">ID: {userId.slice(0, 10)}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => onLogout()}
              title="Гарах"
              className="flex w-full items-center justify-center gap-2 rounded-2xl p-3 text-sm font-semibold text-rose-300/90 transition hover:bg-rose-500/10 hover:text-rose-200"
            >
              <LogOut className="size-4.5" strokeWidth={1.8} />
              {!isCollapsed && <span className="truncate">Гарах</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* 3. ҮНДСЭН КОНТЕНТ — pathname-аар key өгч хуудас солигдоход зөөлөн гарч ирнэ */}
      <main
        key={pathname}
        className="animate-page-in relative z-10 flex w-full min-w-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 md:p-10 lg:pl-6"
      >
        {children}
      </main>
    </div>
  )
}
