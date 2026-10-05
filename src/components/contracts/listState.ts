"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

// Гэрээний жагсаалтын шүүлтүүр, хуудас, табыг URL-д хадгална.
// Гэрээ рүү ороод буцахад (browser back эсвэл "← Гэрээ" линк) төлөв хэвээр үлдэнэ.

const STORAGE_PREFIX = "contracts-list:"

export function useListParams(prefix = "") {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const get = (key: string, fallback = "") => searchParams.get(prefix + key) ?? fallback

  // "all", "" болон null утгыг URL-ээс хасна. page-ээс бусад өөрчлөлт хуудсыг 1 болгоно.
  const update = (changes: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || value === "all" || (key === "page" && value === 1)) {
        next.delete(prefix + key)
      } else {
        next.set(prefix + key, String(value))
      }
    }
    if (!("page" in changes)) next.delete(prefix + "page")
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return { get, update }
}

// Одоогийн жагсаалтын query-г sessionStorage-д хадгална (BackToListLink уншина)
export function useRememberListQuery() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_PREFIX + pathname, query)
    } catch {
      // private горим г.м. — санахгүй ч жагсаалт ажиллана
    }
  }, [pathname, query])
}

export function readListQuery(listPath: string): string {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + listPath) || ""
  } catch {
    return ""
  }
}

// Идэвхтэй хуудасны эргэн тойрны хуудасны дугаарууд (Pagination-д)
export function visiblePageNumbers(current: number, total: number, size = 5): number[] {
  const start = Math.max(1, Math.min(current - Math.floor(size / 2), total - size + 1))
  const end = Math.min(total, start + size - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
