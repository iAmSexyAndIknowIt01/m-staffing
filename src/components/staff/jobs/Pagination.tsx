"use client"

import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  filteredJobsCount: number
  totalPages: number
  isFiltering: boolean
  currentPage: number
  visiblePages: number[]
  setCurrentPage: React.Dispatch<React.SetStateAction<number>> | ((page: number) => void)
}

export default function Pagination({
  filteredJobsCount,
  totalPages,
  isFiltering,
  currentPage,
  visiblePages,
  setCurrentPage,
}: PaginationProps) {
  if (filteredJobsCount === 0 || totalPages <= 1 || isFiltering) return null

  const handlePageChange = (page: number | ((prev: number) => number)) => {
    if (typeof setCurrentPage === "function") {
      if (typeof page === "function") {
        (setCurrentPage as React.Dispatch<React.SetStateAction<number>>)(page)
      } else {
        setCurrentPage(page)
      }
    }
  }

  return (
    // flex-nowrap болон overflow-x-auto оруулснаар хэзээ ч 2 мөр болохгүй
    <div className="flex items-center justify-center gap-1 mt-10 mb-6 flex-nowrap overflow-x-auto max-w-full py-2 select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
      
      {/* Өмнөх хуудас */}
      <button
        onClick={() => handlePageChange((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {/* Эхний хуудас */}
      {visiblePages[0] > 1 && (
        <>
          <button 
            onClick={() => handlePageChange(1)} 
            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
              currentPage === 1 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "bg-white border border-slate-200/70 text-slate-600 hover:border-indigo-200"
            }`}
          >
            1
          </button>
          {visiblePages[0] > 2 && (
            <span className="w-6 sm:w-8 text-center text-slate-400 font-medium text-xs sm:text-sm shrink-0">
              ...
            </span>
          )}
        </>
      )}

      {/* Дундах хуудаснууд */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
            currentPage === page 
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
              : "bg-white border border-slate-200/70 text-slate-600 hover:border-indigo-200"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Сүүлийн хуудас */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="w-6 sm:w-8 text-center text-slate-400 font-medium text-xs sm:text-sm shrink-0">
              ...
            </span>
          )}
          <button 
            onClick={() => handlePageChange(totalPages)} 
            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
              currentPage === totalPages 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                : "bg-white border border-slate-200/70 text-slate-600 hover:border-indigo-200"
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Дараах хуудас */}
      <button
        onClick={() => handlePageChange((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200/70 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
    </div>
  )
}