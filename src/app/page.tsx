import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import Features from "@/components/landing/Features"
import About from "@/components/landing/About"
import Stats from "@/components/landing/Stats"
import CTA from "@/components/landing/CTA"
import Footer from "@/components/landing/Footer"
import ScrollProgress from "@/components/landing/ScrollProgress"
import type { Metadata } from "next"

// www болон www-гүй хаяг хоёулаа ажилладаг тул Google-д үндсэн хаягийг заана
export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function Home() {
  return (
    <>
      <ScrollProgress />

      <Navbar />

      <Hero />

      <Features />

      <About />

      <Stats />

      <CTA />

      <Footer />
    </>
  )
}