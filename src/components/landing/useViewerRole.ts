"use client"

import { useEffect, useState } from "react"

export type ViewerRole = "staff" | "company" | null

// Landing-ийн хэд хэдэн хэсэг нэг хүсэлтээ хуваалцана (static хуудас тул серверт session уншихгүй)
let rolePromise: Promise<ViewerRole> | null = null

function fetchRole(): Promise<ViewerRole> {
  rolePromise ??= fetch("/api/auth/me", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { role: null }))
    .then((data) => (data.role === "staff" || data.role === "company" ? data.role : null))
    .catch(() => null)
  return rolePromise
}

// undefined — хараахан мэдэгдээгүй (зочин гэж үзэж харуулна), null — нэвтрээгүй
export function useViewerRole(): ViewerRole | undefined {
  const [role, setRole] = useState<ViewerRole | undefined>(undefined)
  useEffect(() => {
    let active = true
    fetchRole().then((r) => active && setRole(r))
    return () => {
      active = false
    }
  }, [])
  return role
}
