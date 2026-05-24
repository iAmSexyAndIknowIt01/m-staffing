"use client"

import { useState } from "react"
import Link from "next/link"

interface DashboardShellProps {
  userId: string
  userRole: string
  onLogout: () => Promise<void>
  children: React.ReactNode
}

export default function DashboardShell({ userId, userRole, onLogout, children }: DashboardShellProps) {
  // true үед зурган дээрх шиг зөвхөн айконууд харагдана
  const [isCollapsed, setIsCollapsed] = useState(true)

  return (
    <div className="min-h-screen bg-[#f8faff] flex">
      
      {/* СИДЕМЕНЮ (SIDEMENU) */}
      <aside 
        className={`bg-white border-r border-gray-100 flex flex-col justify-between sticky top-0 h-screen p-4 transition-all duration-300 z-50 ${
          isCollapsed ? "w-[88px]" : "w-64"
        }`}
      >
        <div className="space-y-8">
          {/* Дээд хэсэг: Төгсгөл дэх Хянах/Хумих Товч */}
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
            {/* 1. Dashboard (Идэвхтэй төлөв - Зурган дээрх шиг фиолетово/цэнхэр туяатай) */}
            <Link 
              href="/dashboard" 
              className="flex items-center gap-4 p-3 rounded-2xl bg-indigo-50 text-indigo-600 font-semibold transition justify-center lg:justify-start"
            >
              <span className="text-xl bg-indigo-100/50 p-1.5 rounded-xl block">
                {/* Зурган дээрх Grid айкон */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </span>
              {!isCollapsed && <span className="text-sm truncate">Хянах самбар</span>}
            </Link>

            {/* Ролиос хамаарсан бусад линкүүд */}
            {userRole === "staff" ? (
              <>
                <Link href="/dashboard/jobs" className="flex items-center gap-4 p-3 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition">
                  <span className="text-xl p-1.5 rounded-xl block">💼</span>
                  {!isCollapsed && <span className="text-sm truncate">Ажлын байрууд</span>}
                </Link>
                <Link href="/dashboard/profile" className="flex items-center gap-4 p-3 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition">
                  <span className="text-xl p-1.5 rounded-xl block">📄</span>
                  {!isCollapsed && <span className="text-sm truncate">Миний CV</span>}
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/post-job" className="flex items-center gap-4 p-3 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition">
                  <span className="text-xl p-1.5 rounded-xl block">➕</span>
                  {!isCollapsed && <span className="text-sm truncate">Зар нэмэх</span>}
                </Link>
                <Link href="/dashboard/applicants" className="flex items-center gap-4 p-3 rounded-2xl text-gray-500 hover:bg-gray-50 hover:text-orange-500 transition">
                  <span className="text-xl p-1.5 rounded-xl block">👥</span>
                  {!isCollapsed && <span className="text-sm truncate">Анкетууд</span>}
                </Link>
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