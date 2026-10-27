import React from "react"

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

// Системийн загвартай select. Сумыг globals.css-ийн нийтлэг select дүрэм зурна;
// className-ээр өргөн, өнгө зэргийг нэмж өгч болно.
export default function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full h-11 pl-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition ${className}`}
    >
      {children}
    </select>
  )
}
