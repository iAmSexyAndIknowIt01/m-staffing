"use client"

import { useCallback, useEffect, useState } from "react"
import { getErrorMessage } from "@/lib/errors"
import type { ContractTemplate, ContractTemplateInput } from "@/types/contract"

// Гэрээний загварын API дуудлагууд (Загварууд таб, гэрээний ноорог, шинэ гэрээ үүсгэх)

const BASE = "/api/company/contracts/templates"

async function request<T>(url: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const res = await fetch(url, init)
  const result = await res.json()
  if (!res.ok) throw new Error(result.error || fallback)
  return result.data
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const fetchTemplates = () => request<ContractTemplate[]>(BASE, undefined, "Загвар татахад алдаа гарлаа")

export const createTemplate = (input: ContractTemplateInput) =>
  request<ContractTemplate>(BASE, json("POST", input), "Загвар хадгалахад алдаа гарлаа")

export const updateTemplate = (id: string, input: ContractTemplateInput) =>
  request<ContractTemplate>(`${BASE}/${id}`, json("PUT", input), "Загвар хадгалахад алдаа гарлаа")

export const deleteTemplate = (id: string) =>
  request<void>(`${BASE}/${id}`, { method: "DELETE" }, "Загвар устгахад алдаа гарлаа")

// enabled=false үед татахгүй (цонх нээгдэх үед л татна)
export function useContractTemplates(enabled = true) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTemplates(await fetchTemplates())
    } catch (err) {
      setError(getErrorMessage(err, "Серверийн алдаа гарлаа"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchTemplates()
      .then((data) => !cancelled && setTemplates(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, "Серверийн алдаа гарлаа")))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { templates, loading, error, reload }
}
