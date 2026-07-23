"use client"

import React, { useState, useRef, useEffect } from "react"
import { Search, X, CheckCircle2, ChevronDown } from "lucide-react"

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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Гадна дархад dropdown хаагдах логик
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getJobTypeLabel = (type: string) => {
    if (type === "fulltime") return "Бүтэн цаг"
    if (type === "parttime") return "Хагас цагийн"
    if (type === "remote") return "Зайнаас (Remote)"
    return type
  }

  const getFilterAppliedLabel = (status: string) => {
    if (status === "applied") return "Хүсэлт илгээсэн"
    if (status === "not_applied") return "Хүсэлт илгээгээгүй"
    return "Бүх ажлын санал"
  }

  const options = [
    { value: "all", label: "Бүх ажлын санал" },
    { value: "applied", label: "Хүсэлт илгээсэн" },
    { value: "not_applied", label: "Хүсэлт илгээгээгүй" },
  ]

  return (
    <div className="w-full flex flex-col gap-2.5 font-sans select-none">
      
      {/* Үндсэн хэсэг: Хайлт болон Custom Dropdown */}
      <div className="w-full flex flex-col md:flex-row gap-2 items-center">
        
        {/* Хайлтын талбар */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Ажил хайх (Байршил...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 text-[14px] rounded-xl border border-slate-200 shadow-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100/50 transition-all"
          />
        </div>

        {/* Custom Design Dropdown */}
        <div className="relative w-full md:w-60 shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-4 py-2.5 bg-white text-[14px] rounded-xl border shadow-xs outline-none transition-all flex items-center justify-between font-medium ${
              isOpen 
                ? "border-indigo-400 ring-2 ring-indigo-100/50 text-slate-900" 
                : "border-slate-200 text-slate-800 hover:bg-slate-50/80"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${filterApplied !== "all" ? "text-indigo-600" : "text-slate-400"}`} />
              <span className="truncate">{getFilterAppliedLabel(filterApplied)}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-600" : ""}`} />
          </button>

          {/* Dropdown Options Box */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
              {options.map((opt) => {
                const isSelected = filterApplied === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setFilterApplied(opt.value)
                      setIsOpen(false)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between transition-colors ${
                      isSelected 
                        ? "bg-indigo-50/60 text-indigo-700 font-semibold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

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

        {/* Категориуд */}
        {categories.map((cat) => {
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
              <span>{selectedCategory === "it" || selectedCategory === "IT" ? "IT" : selectedCategory}</span>
              <button onClick={() => setSelectedCategory("")} className="text-slate-400 hover:text-slate-600 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filterApplied !== "all" && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md text-[12px] text-slate-800 font-medium">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
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