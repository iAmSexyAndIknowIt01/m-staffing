import UbSkyline from "@/components/landing/UbSkyline"

// Мэндчилгээний card-ийн доод зурваст гүйх Улаанбаатарын skyline (нүүр хуудасны footer-тэй ижил).
// Card-ийн агуулгын ард (z-0) байрлах тул агуулгын div-үүд relative z-1 байх ёстой.
export default function HeroSkyline() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0">
      {/* Намхан тул tile нарийсна — өргөн дэлгэцийг дүүргэхэд 8 хуулбар */}
      <UbSkyline sizeClassName="h-14 sm:h-16 text-white/25" tiles={8} />
    </div>
  )
}
