"use client"

import Link from "next/link"
import { useViewerRole } from "./useViewerRole"

// Footer-ийн «Платформ» холбоосууд — нэвтэрсэн бол өөрт хамааралгүйг нууж, «Хянах самбар» харуулна
export default function FooterPlatformLinks() {
  const role = useViewerRole()
  return (
    <>
      {role !== "company" && (
        <Link href="/dashboard/staff/jobs" className="hover:text-orange-400 transition">
          Ажил хайх
        </Link>
      )}
      {role !== "staff" && (
        <Link href="/dashboard/company/search-staff" className="hover:text-orange-400 transition">
          Ажилтан хайх
        </Link>
      )}
      {role ? (
        <Link href="/dashboard" className="hover:text-orange-400 transition">
          Хянах самбар
        </Link>
      ) : (
        <Link href="/register" className="hover:text-orange-400 transition">
          Бүртгүүлэх
        </Link>
      )}
    </>
  )
}
