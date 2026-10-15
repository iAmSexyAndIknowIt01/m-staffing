import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Unbounded } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

// Гарчиг, лого, тоонд ашиглах футурист display фонт (кирилл дэмжинэ)
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
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
  themeColor: "#0a0b14",
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
      className={`${inter.variable} ${unbounded.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      style={{ scrollBehavior: "smooth" }}
    >
      {/* body дээр min-h-screen болон flex-col өгч мобайл үеийн илүүдэл цагаан зайг арилгасан */}
      <body className="min-h-screen flex flex-col font-sans bg-[#f6f7fb] text-gray-900 m-0 p-0 overflow-x-hidden">
        
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        
      </body>
    </html>
  );
}