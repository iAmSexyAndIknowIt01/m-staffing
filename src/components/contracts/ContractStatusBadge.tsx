import { CONTRACT_STATUS_LABELS } from "@/lib/contracts"
import type { ContractStatus } from "@/types/contract"

const STYLES: Record<ContractStatus, string> = {
  draft: "bg-gray-50 text-gray-600 border-gray-200/50",
  sent: "bg-amber-50 text-amber-600 border-amber-200/50",
  active: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
  declined: "bg-orange-50 text-orange-600 border-orange-200/50",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200/50",
  terminated: "bg-rose-50 text-rose-600 border-rose-200/50",
  expired: "bg-slate-100 text-slate-500 border-slate-200/50",
}

export default function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border ${STYLES[status]}`}>
      {CONTRACT_STATUS_LABELS[status]}
    </span>
  )
}
