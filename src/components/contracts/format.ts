import { SALARY_TYPE_LABELS } from "@/lib/contracts"
import type { ContractSalaryType } from "@/types/contract"

// mt_openjob.job_type
export const JOB_TYPE_LABELS: Record<string, string> = {
  fulltime: "Бүтэн цаг",
  parttime: "Хагас цаг",
  contract: "Гэрээт",
  intern: "Дадлагажигч",
  remote: "Зайнаас",
}

export function formatSalary(amount: number, type: ContractSalaryType): string {
  return `${Number(amount).toLocaleString("mn-MN")}₮ / ${SALARY_TYPE_LABELS[type].toLowerCase()}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString("mn-MN")
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleString("mn-MN")
}

// Гэрээний баримтыг PDF болгон татах (html2pdf.js-ийг зөвхөн хэрэгтэй үед ачаална)
export async function downloadContractPdf(element: HTMLElement, contractNumber: string) {
  const html2pdf = (await import("html2pdf.js")).default
  await html2pdf()
    .set({
      margin: 10,
      filename: `Geree_${contractNumber}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    })
    .from(element)
    .save()
}
