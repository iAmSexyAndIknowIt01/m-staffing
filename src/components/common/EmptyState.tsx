import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
  className?: string
}

// Жагсаалт хоосон үед: дүрс, тайлбар болон дараагийн алхмын товч
export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center px-6 py-10 bg-white border border-gray-100 rounded-3xl ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
        <Icon className="w-6 h-6" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-800">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
