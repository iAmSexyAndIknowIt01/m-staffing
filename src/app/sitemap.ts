import type { MetadataRoute } from "next"
import { getSiteOrigin } from "@/lib/url"

// Нэвтрэхгүйгээр харагдах нийтийн хуудсууд (dashboard, admin, API-г оруулахгүй)
const PUBLIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/register", priority: 0.8, changeFrequency: "yearly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin()
  return PUBLIC_PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${origin}${path}`,
    changeFrequency,
    priority,
  }))
}
