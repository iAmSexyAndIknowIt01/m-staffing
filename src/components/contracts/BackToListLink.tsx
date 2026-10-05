"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { readListQuery } from "./listState"

// Гэрээний дэлгэрэнгүйгээс жагсаалт руу буцах — сүүлийн шүүлтүүр, хуудсыг сэргээнэ
export default function BackToListLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter()

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        const query = readListQuery(href)
        if (!query) return
        e.preventDefault()
        router.push(`${href}?${query}`)
      }}
    >
      {children}
    </Link>
  )
}
