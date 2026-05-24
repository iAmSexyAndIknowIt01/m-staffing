"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface DashboardShellProps {
  userId: string
  userRole: string
  onLogout: () => Promise<void>
  children: React.ReactNode
}

export default function DashboardShell({ userId, userRole, onLogout, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()

  // Идэвхтэй болон идэвхгүй үеийн стилийг тодорхойлох туслах функц
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
    <div className="min-h-screen bg-[#f8faff] flex">
      
      {/* СИДЕМЕНЮ (SIDEMENU) */}
      <aside 
        className={`bg-white border-r border-gray-100 flex flex-col justify-between sticky top-0 h-screen p-4 transition-all duration-300 z-50 ${
          isCollapsed ? "w-[88px]" : "w-64"
        }`}
      >
        <div className="space-y-8">
          {/* Дээд хэсэг */}
          <div className="flex items-center justify-between px-2 py-2">
            {!isCollapsed && (
              <span className="text-md font-black tracking-[3px] text-orange-500 animate-fade-in">
                MSTAFFING
              </span>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition mx-auto"
              title={isCollapsed ? "Дэлгэх" : "Хумих"}
            >
              {isCollapsed ? "👉" : "👈"}
            </button>
          </div>

          {/* Цэсний линкүүд */}
          <nav className="space-y-3 flex flex-col">
            
            {/* 1. Dashboard Хянах самбар (Бусадтай адилхан emoji айконтой болгов) */}
            {(() => {
              const { linkClass, iconClass } = getLinkStyles("/dashboard")
              return (
                <Link href="/dashboard" className={linkClass}>
                  <span className={iconClass}>📊</span>
                  {!isCollapsed && <span className="text-sm truncate">Хянах самбар</span>}
                </Link>
              )
            })()}

            {/* Ролиос хамаарсан бусад линкүүд */}
            {userRole === "staff" ? (
              <>
                {/* Ажлын байрууд */}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/staff/jobs")
                  return (
                    <Link href="/dashboard/staff/jobs" className={linkClass}>
                      <span className={iconClass}>💼</span>
                      {!isCollapsed && <span className="text-sm truncate">Ажлын байрууд</span>}
                    </Link>
                  )
                })()}

                {/* Миний CV */}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/staff/profile")
                  return (
                    <Link href="/dashboard/staff/profile" className={linkClass}>
                      <span className={iconClass}>📄</span>
                      {!isCollapsed && <span className="text-sm truncate">Миний CV</span>}
                    </Link>
                  )
                })()}
              </>
            ) : (
              <>
                {/* Зар нэмэх */}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/company/post-job")
                  return (
                    <Link href="/dashboard/company/post-job" className={linkClass}>
                      <span className={iconClass}>➕</span>
                      {!isCollapsed && <span className="text-sm truncate">Зар нэмэх</span>}
                    </Link>
                  )
                })()}

                {/* Ирсэн Анкетууд */}
                {(() => {
                  const { linkClass, iconClass } = getLinkStyles("/dashboard/company/applicants")
                  return (
                    <Link href="/dashboard/company/applicants" className={linkClass}>
                      <span className={iconClass}>👥</span>
                      {!isCollapsed && <span className="text-sm truncate">Анкетууд</span>}
                    </Link>
                  )
                })()}
              </>
            )}
          </nav>
        </div>

        {/* Доод хэсэг: Хэрэглэгч болон Гарах товч */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold">
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

      {/* БАРУУН ТАЛЫН ҮНДСЭН КОНТЕНТ */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}