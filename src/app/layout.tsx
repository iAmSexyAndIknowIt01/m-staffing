import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import FloatingThemeToggle from "@/components/theme/FloatingThemeToggle";
import AppDialogHost from "@/components/common/AppDialog";
import ScrollToTop from "@/components/common/ScrollToTop";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
  width: "device-width",
  initialScale: 1,
};

const baseUrl = process.env.NODE_ENV === "production" 
  ? "https://m-staffing.mn" 
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "MStaffing | Ажлын байрны нэгдсэн систем",
    template: "%s | MStaffing",
  },
  description: "Монголын шилдэг компаниудад ажилд зуучлах нэгдсэн платформ.",
  keywords: ["ажил", "ажлын байр", "CV илгээх", "Японд ажиллах", "MStaffing", "ажилд орох"],
  authors: [{ name: "MStaffing Team" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "https://m-staffing.mn",
    title: "MStaffing | Ажлын байрны нэгдсэн систем",
    description: "Танд тохирох нээлттэй ажлын байрууд.",
    siteName: "MStaffing",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MStaffing Platform",
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
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      style={{ scrollBehavior: "smooth" }}
      // THEME_INIT_SCRIPT нь hydration-аас өмнө html-д "dark" class нэмж болзошгүй
      suppressHydrationWarning
    >
      <head>
        {/* Хуудас зурагдахаас өмнө горимыг тавьж цагаан анивчилтаас сэргийлнэ */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* body дээр min-h-screen болон flex-col өгч мобайл үеийн илүүдэл цагаан зайг арилгасан */}
      <body className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900 selection:bg-orange-500 selection:text-white m-0 p-0 overflow-x-hidden">
        
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>

        <FloatingThemeToggle />
        <AppDialogHost />
        <ScrollToTop />
        
      </body>
    </html>
  );
}