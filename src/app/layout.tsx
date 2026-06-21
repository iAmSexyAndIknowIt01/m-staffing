import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google"; // 1. Inter фонтыг импортлов
import "./globals.css";

// 2. Крилл үсгийг дэмжих Inter фонтыг тохируулав
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"], // 👈 Энд cyrillic гэж заавал зааж өгнө
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M-Staffing",
  description: "Ажлын байрны зуучлалын нэгдсэн систем",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn" // 3. Хэлийг mn (Монгол) болгов
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      {/* 4. Үндсэн биеийн фонтыг font-sans болгов (globals.css-д тохируулна) */}
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}