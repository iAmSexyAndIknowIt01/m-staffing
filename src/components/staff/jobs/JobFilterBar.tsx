"use client"

import React from "react"
import { Search, X } from "lucide-react"

interface JobFilterBarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  selectedCategory: string
  setSelectedCategory: (val: string) => void
  selectedJobType: string
  setSelectedJobType: (val: string) => void
  filterApplied: string
  setFilterApplied: (val: string) => void
  categories: string[]
}

export default function JobFilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedJobType,
  setSelectedJobType,
  filterApplied,
  setFilterApplied,
  categories,
}: JobFilterBarProps) {

  const isFiltered = 
    selectedCategory !== "" || 
    selectedJobType !== "" || 
    filterApplied !== "all"

  const handleClearAll = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedJobType("")
    setFilterApplied("all")
  }

  const getJobTypeLabel = (type: string) => {
    if (type === "fulltime") return "Бүтэн цаг"
    if (type === "parttime") return "Хагас цагийн"
    if (type === "remote") return "Зайнаас (Remote)"
    return type
  }

  const getFilterAppliedLabel = (status: string) => {
    if (status === "applied") return "Илгээсэн анкет"
    if (status === "not_applied") return "Илгээгээгүй ажил"
    return status
  }

  return (
    <div className="w-full flex flex-col gap-2.5 font-sans select-none">
      
      {/* Үндсэн хэсэг: Хайлт болон Тагууд */}
      <div className="w-full flex flex-col gap-2">
        
        {/* Хайлтын талбар */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Ажил хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 text-[14px] rounded-xl border border-slate-200 shadow-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 transition-all"
          />
        </div>

        {/* Шүүлтүүрийн Тагууд */}
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
          {/* Ажлын төрлүүд */}
          {["fulltime", "parttime", "remote"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedJobType(selectedJobType === type ? "" : type)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border whitespace-nowrap transition-all duration-150 active:scale-95 shrink-0 ${
                selectedJobType === type
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {getJobTypeLabel(type)}
            </button>
          ))}

          {/* Категориуд (Одоо давхардахгүй, цэвэрхэн харагдана) */}
          {categories.map((cat) => {
            // Харьцуулалтыг том жижиг үсэг харгалзахгүй хийнэ
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? "" : cat)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border whitespace-nowrap transition-all duration-150 active:scale-95 shrink-0 ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

      </div>

      {/* Доод хэсэг: Идэвхтэй байгаа шүүлтүүрүүд (X) */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5 px-0.5 animate-in fade-in duration-200">
          
          {selectedJobType && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md text-[12px] text-slate-800 font-medium">
              <span>{getJobTypeLabel(selectedJobType)}</span>
              <button onClick={() => setSelectedJobType("")} className="text-slate-400 hover:text-slate-600 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {selectedCategory && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md text-[12px] text-slate-800 font-medium">
              {/* Сонгосон нэрийг яг хэвээр нь харуулна (IT бол IT, Marketing бол Marketing) */}
              <span>{selectedCategory === "it" || selectedCategory === "IT" ? "IT" : selectedCategory}</span>
              <button onClick={() => setSelectedCategory("")} className="text-slate-400 hover:text-slate-600 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filterApplied !== "all" && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md text-[12px] text-slate-800 font-medium">
              <span>{getFilterAppliedLabel(filterApplied)}</span>
              <button onClick={() => setFilterApplied("all")} className="text-slate-400 hover:text-slate-600 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={handleClearAll}
            className="text-[12px] text-indigo-600 hover:text-indigo-700 font-semibold transition-colors ml-1 py-1"
          >
            Бүгдийг цэвэрлэх
          </button>

        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  )
}