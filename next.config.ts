import type { NextConfig } from "next";
import path from "path";

// Бүх хариунд нэмэх аюулгүй байдлын header-ууд
const SECURITY_HEADERS = [
  // Сайтыг өөр сайтын iframe дотор харуулахыг хориглоно (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Хөтөч файлын төрлийг таамаглахгүй, зарласан Content-Type-аар нь уншина
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Гадны сайт руу шилжихэд зөвхөн домэйныг дамжуулна (URL дахь параметр алдагдахгүй)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Ашигладаггүй төхөөрөмжийн эрхийг хаана
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Зөвхөн HTTPS-ээр холбогдоно (2 жил)
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
]

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },
  experimental: {
    // Next.js-ийн upgrade агент зөвхөн аюулгүй байдлын шинэчлэлтийг санал болгоно
    agentUpgrade: "security",
  },
  // Home хавтас дахь өөр lockfile-ийг root гэж андуурахаас сэргийлнэ
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
