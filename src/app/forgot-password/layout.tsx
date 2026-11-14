import type { Metadata } from "next"

// page.tsx нь client component тул metadata-г энд тодорхойлно
export const metadata: Metadata = {
  title: "Нууц үг сэргээх",
  alternates: { canonical: "/forgot-password" },
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
