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

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

const baseUrl = process.env.NODE_ENV === "production" 
  ? "https://m-staffing.mn" 
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
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
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ scrollBehavior: "smooth" }}
    >
      {/* body дээр min-h-full болон flex-col өгч футерийг доор барих суурийг бэлдсэн */}
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900 selection:bg-orange-500 selection:text-white m-0 p-0 overflow-x-hidden">
        
        {/* 
          pt-20-ийг хассан тул Dashboard-д ямар нэгэн илүүдэл зай гарахгүй.
          Харин Navbar-тай хуудсууд дээрээ (жишээ нь landing page) тухайн хуудасных нь гадна талын div дээр pt-20-ийг өгөөрэй.
        */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        
      </body>
    </html>
  );
}