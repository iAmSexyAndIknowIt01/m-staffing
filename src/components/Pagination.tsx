"use client"

import React from "react"

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
  // Хуудаслалт харуулах шаардлагагүй үед юу ч дүрслэхгүй
  if (filteredJobsCount === 0 || totalPages <= 1 || isFiltering) return null

  // Төлөв шинэчлэх функцийг аюулгүй дуудах туслах функц
  const handlePageChange = (page: number | ((prev: number) => number)) => {
    if (typeof setCurrentPage === "function") {
      if (typeof page === "function") {
        // React-ийн setState action бол
        (setCurrentPage as React.Dispatch<React.SetStateAction<number>>)(page)
      } else {
        // Энгийн тоо дамжуулж байвал
        setCurrentPage(page)
      }
    }
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Өмнөх
      </button>
      
      {visiblePages[0] > 1 && (
        <>
          <button 
            onClick={() => handlePageChange(1)} 
            className="w-10 h-10 rounded-xl border bg-white"
          >
            1
          </button>
          {visiblePages[0] > 2 && <span className="px-2">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
            currentPage === page 
              ? "bg-indigo-600 text-white" 
              : "bg-white border border-gray-200 hover:border-indigo-300"
          }`}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="px-2">...</span>}
          <button 
            onClick={() => handlePageChange(totalPages)} 
            className="w-10 h-10 rounded-xl border bg-white"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => handlePageChange((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Дараах →
      </button>
    </div>
  )
}