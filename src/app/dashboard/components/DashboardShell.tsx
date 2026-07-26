"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import LinkNext from "next/link"

interface DashboardShellProps {
  userId: string
  userRole: string
  onLogout: () => Promise<void>
  children: React.ReactNode
}

export default function DashboardShell({ userId, userRole, onLogout, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getLinkStyles = (href: string) => {
    const isActive = pathname === href
    return {
      linkClass: `flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 justify-center lg:justify-start ${
        isActive 
          ? "bg-indigo-50 text-indigo-600 font-semibold shadow-sm"
          : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
      }`,
      iconClass: `text-xl p-1.5 rounded-xl block transition-colors ${
        isActive ? "bg-indigo-100/60 text-indigo-600" : "text-gray-400"
      }`
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col lg:flex-row w-full relative">
      
      {/* 1. MOBILE NAVBAR */}
      <div className="lg:hidden w-full h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50 shrink-0">
        <LinkNext 
          href="/dashboard" 
          onClick={() => setMobileMenuOpen(false)}
          className="font-black text-orange-500 hover:opacity-80 transition"
        >
          MSTAFFING
        </LinkNext>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-2xl p-2 focus:outline-none text-gray-700"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full bg-white border-b border-gray-100 z-40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="p-4 space-y-3">
            <LinkNext
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 rounded-xl hover:bg-gray-50"
            >
              📊 Хянах самбар
            </LinkNext>

            {userRole === "staff" ? (
              <>
                <LinkNext
                  href="/dashboard/staff/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  💼 Ажлын байрууд
                </LinkNext>
                <LinkNext
                  href="/dashboard/staff/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  👤 Миний Профайл
                </LinkNext>
                <LinkNext
                  href="/dashboard/staff/cv"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  📄 Миний CV
                </LinkNext>
                {/* --- Миний хүсэлт (Мобайл) --- */}
                <LinkNext
                  href="/dashboard/staff/requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  📨 Миний хүсэлт
                </LinkNext>
              </>
            ) : (
              <>
                <LinkNext
                  href="/dashboard/company/post-job"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  ➕ Зар нэмэх
                </LinkNext>
                <LinkNext
                  href="/dashboard/company/applicants"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  👥 Анкетууд
                </LinkNext>
                <LinkNext
                  href="/dashboard/company/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-xl hover:bg-gray-50"
                >
                  🏢 Компани профайл
                </LinkNext>
              </>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left p-3 rounded-xl text-red-500 hover:bg-red-50"
            >
              🚪 Гарах
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
              <LinkNext href="/dashboard" className="text-md font-black tracking-[3px] text-orange-500 animate-fade-in hover:opacity-80 transition">
                MSTAFFING
              </LinkNext>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition mx-auto group border border-gray-200/50"
              title={isCollapsed ? "Меню нээх" : "Меню хаах"}
            >
              {isCollapsed ? (
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <span className="text-white text-sm font-black tracking-tighter leading-none select-none">
                    M
                  </span>
                </div>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="2.5" 
                  stroke="currentColor" 
                  className="w-5 h-5 text-orange-500 group-hover:-translate-x-0.5 transition-transform duration-200"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>

          <nav className="space-y-3 flex flex-col">
            {(() => {
              const { linkClass, iconClass } = getLinkStyles("/dashboard")
              return (
                <LinkNext href="/dashboard" className={linkClass}>
                  <span className={iconClass}>📊</span>
                  {!isCollapsed && <span className="text-sm truncate">Хянах самбар</span>}
                </LinkNext>
              )
            })()}

            {userRole === "staff" ? (
              <>
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/staff/jobs")
                  return (
                    <LinkNext href="/dashboard/staff/jobs" className={linkClass}>
                      <span className={iconClass}>💼</span>
                      {!isCollapsed && <span className="text-sm truncate">Ажлын байрууд</span>}
                    </LinkNext>
                  )
                })()}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/staff/profile")
                  return (
                    <LinkNext href="/dashboard/staff/profile" className={linkClass}>
                      <span className={iconClass}>👤</span>
                      {!isCollapsed && <span className="text-sm truncate">Миний Профайл</span>}
                    </LinkNext>
                  )
                })()}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/staff/cv")
                  return (
                    <LinkNext href="/dashboard/staff/cv" className={linkClass}>
                      <span className={iconClass}>📄</span>
                      {!isCollapsed && <span className="text-sm truncate">Миний CV</span>}
                    </LinkNext>
                  )
                })()}
                {/* --- Миний хүсэлт (Десктоп) --- */}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/staff/requests")
                  return (
                    <LinkNext href="/dashboard/staff/requests" className={linkClass}>
                      <span className={iconClass}>📨</span>
                      {!isCollapsed && <span className="text-sm truncate">Миний хүсэлт</span>}
                    </LinkNext>
                  )
                })()}
              </>
            ) : (
              <>
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/company/post-job")
                  return (
                    <LinkNext href="/dashboard/company/post-job" className={linkClass}>
                      <span className={iconClass}>➕</span>
                      {!isCollapsed && <span className="text-sm truncate">Зар нэмэх</span>}
                    </LinkNext>
                  )
                })()}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/company/applicants")
                  return (
                    <LinkNext href="/dashboard/company/applicants" className={linkClass}>
                      <span className={iconClass}>👥</span>
                      {!isCollapsed && <span className="text-sm truncate">Анкетууд</span>}
                    </LinkNext>
                  )
                })()}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/company/profile")
                  return (
                    <LinkNext href="/dashboard/company/profile" className={linkClass}>
                      <span className={iconClass}>🏢</span>
                      {!isCollapsed && <span className="text-sm truncate">Компани профайл</span>}
                    </LinkNext>
                  )
                })()}
              </>
            )}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 min-w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
              {userRole === "staff" ? "👤" : "🏢"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {userRole === "staff" ? "Ажил Хайгч" : "Ажил Олгогч"}
                </p>
                <p className="text-[10px] text-gray-400 font-mono truncate">ID: {userId.slice(0, 10)}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => onLogout()}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-sm font-semibold text-red-500 bg-red-50/50 hover:bg-red-50 transition"
          >
            🚪 {!isCollapsed && <span className="truncate">Гарах</span>}
          </button>
        </div>
      </aside>

      {/* 3. ҮНДСЭН КОНТЕНТ */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full flex flex-col">
        {children}
      </main>

    </div>
  )
}