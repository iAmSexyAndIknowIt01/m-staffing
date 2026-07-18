"use client"

import React from "react"
import { Search, ChevronDown, SlidersHorizontal, Briefcase, Layers } from "lucide-react"

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
  return (
    <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
      
      {/* 1. Хайлтын талбар */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Ажил, компани хайх..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition duration-200"
        />
      </div>

      {/* 2. Чиглэл / Категори */}
      <div className="relative flex items-center">
        <Layers className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition duration-200 text-slate-700 font-medium appearance-none cursor-pointer"
        >
          <option value="">Бүх чиглэл</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 text-slate-400 w-4 h-4 pointer-events-none" />
      </div>

      {/* 3. Ажлын төрөл */}
      <div className="relative flex items-center">
        <Briefcase className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
        <select
          value={selectedJobType}
          onChange={(e) => setSelectedJobType(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition duration-200 text-slate-700 font-medium appearance-none cursor-pointer"
        >
          <option value="">Ажлын цаг</option>
          <option value="fulltime">Бүтэн цаг</option>
          <option value="parttime">Хагас цаг</option>
          <option value="remote">Зайнаас (Remote)</option>
        </select>
        <ChevronDown className="absolute right-4 text-slate-400 w-4 h-4 pointer-events-none" />
      </div>

      {/* 4. Шүүлтүүрийн төлөв */}
      <div className="relative flex items-center">
        <SlidersHorizontal className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
        <select
          value={filterApplied}
          onChange={(e) => setFilterApplied(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-slate-50 rounded-xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition duration-200 text-slate-700 font-medium appearance-none cursor-pointer"
        >
          <option value="all">Бүх ажлууд</option>
          <option value="applied">Илгээсэн анкет</option>
          <option value="not_applied">Илгээгээгүй ажил</option>
        </select>
        <ChevronDown className="absolute right-4 text-slate-400 w-4 h-4 pointer-events-none" />
      </div>

    </div>
  )
}