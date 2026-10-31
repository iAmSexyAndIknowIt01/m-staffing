import type { MetadataRoute } from "next"
import { getSiteOrigin } from "@/lib/url"

// Хайлтын системд нийтийн хуудсуудыг индексжүүлж, нэвтрэх шаардлагатай хэсгүүдийг хасна
export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/forgot-password"] },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
