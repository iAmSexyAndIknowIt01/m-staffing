// Хүсэлт илгээгчийн IP.
// x-forwarded-for-ийн эхний утгыг клиент өөрөө зохиож илгээж болдог тул ашиглахгүй.
// Proxy (Vercel, nginx)-ийн тавьдаг x-real-ip-г, байхгүй бол x-forwarded-for-ийн
// хамгийн сүүлийн утгыг (хамгийн ойрын proxy-н нэмсэн) авна.
export function getClientIp(req: Request): string | null {
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwarded = req.headers.get("x-forwarded-for")
  const hops = forwarded?.split(",").map((ip) => ip.trim()).filter(Boolean) ?? []
  return hops.at(-1) ?? null
}
