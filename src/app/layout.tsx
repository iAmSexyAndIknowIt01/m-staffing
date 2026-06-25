import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Дэлгэцийн хэмжээ болон өнгөний суурь тохиргоо
export const viewport: Viewport = {
  themeColor: "#f97316", // Orange-500
  width: "device-width",
  initialScale: 1,
};

// Продакшн болон хөгжүүлэлтийн орчны URL-ийг тодорхойлох
const baseUrl = process.env.NODE_ENV === "production" 
  ? "https://m-staffing.mn" 
  : "http://localhost:3000";

// 2. SEO болон OpenGraph (Сошиал хуваалцалт) тохиргоо
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl), // 👈 1. Метадата зургийн алдааг зассан хэсэг
  title: {
    default: "M-Staffing | Ажлын байрны нэгдсэн систем",
    template: "%s | M-Staffing",
  },
  description: "Монголын шилдэг компаниудад ажилд зуучлах нэгдсэн платформ.",
  keywords: ["ажил", "ажлын байр", "CV илгээх", "Японд ажиллах", "M-Staffing", "ажилд орох"],
  authors: [{ name: "M-Staffing Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "https://m-staffing.mn",
    title: "M-Staffing | Ажлын байрны нэгдсэн систем",
    description: "Танд тохирох нээлттэй ажлын байрууд.",
    siteName: "M-Staffing",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "M-Staffing Platform",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      data-scroll-behavior="smooth" // 👈 2. Хөтчийн scroll-behavior сануулгыг зассан хэсэг
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ scrollBehavior: "smooth" }}
    >
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900 selection:bg-orange-500 selection:text-white">
        
        {/* Үндсэн контент */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
      </body>
    </html>
  );
}