import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import Features from "@/components/landing/Features"
import Stats from "@/components/landing/Stats"
import CTA from "@/components/landing/CTA"
import Footer from "@/components/landing/Footer"
import ScrollProgress from "@/components/landing/ScrollProgress"

export default function Home() {
  return (
    <>
      <ScrollProgress />

      <Navbar />

      <Hero />

      <Features />

      <Stats />

      <CTA />

      <Footer />
    </>
  )
}