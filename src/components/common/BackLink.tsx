import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Хуудасны гарчгийн дээрх «буцах» холбоос — бүх хуудсанд ижил загвартай
export default function BackLink({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 transition ${className}`}
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </Link>
  )
}
