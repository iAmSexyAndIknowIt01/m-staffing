"use client"

import React from "react"

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
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="relative flex items-center col-span-1 md:col-span-1">
        <span className="absolute left-4 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Ажил, компани, байршлаар..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition"
        />
      </div>

      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition text-gray-600 appearance-none cursor-pointer"
      >
        <option value="">Бүх чиглэл (Category)</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.toUpperCase()}
          </option>
        ))}
      </select>

      <select
        value={selectedJobType}
        onChange={(e) => setSelectedJobType(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition text-gray-600 appearance-none cursor-pointer"
      >
        <option value="">Ажлын цагийн төрөл</option>
        <option value="fulltime">Бүтэн цаг</option>
        <option value="parttime">Хагас цаг</option>
        <option value="remote">Зайнаас (Remote)</option>
      </select>

      <select
        value={filterApplied}
        onChange={(e) => setFilterApplied(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-sm border border-transparent focus:border-indigo-500 focus:bg-white outline-none transition text-gray-600 appearance-none cursor-pointer font-medium"
      >
        <option value="all">Бүх ажлыг харуулах</option>
        <option value="applied">Хүсэлт илгээсэн ажил</option>
        <option value="not_applied">Хүсэлт илгээгээгүй ажил</option>
      </select>
    </div>
  )
}