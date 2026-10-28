import Link from "next/link"
import FoalIllustration, { type FoalVariant } from "@/components/common/FoalIllustration"

interface EmptyStateProps {
  // Унага маскотын дүр: walk (мэдээлэл алга), search (хайлт олдсонгүй), folder (жагсаалт хоосон), error (алдаа)
  illustration?: FoalVariant
  title: string
  description?: string
  action?: { label: string; href: string }
  // compact: хянах самбарын жижиг хэсгүүдэд (зураг жижиг, зай бага)
  compact?: boolean
  className?: string
}

// Жагсаалт хоосон үед: унагын зураг, тайлбар болон дараагийн алхмын товч
export default function EmptyState({ illustration = "walk", title, description, action, compact, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center text-center bg-white border border-gray-100 rounded-3xl ${
        compact ? "px-5 py-6" : "px-6 py-10"
      } ${className}`}
    >
      <FoalIllustration variant={illustration} size={compact ? 112 : 156} />
      <p className={`${compact ? "mt-2" : "mt-3"} text-base font-semibold text-gray-900`}>{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
