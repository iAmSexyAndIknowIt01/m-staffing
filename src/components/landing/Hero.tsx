import Image from "next/image"
import Link from "next/link"

export default function Hero() {
  return (
    <section
      className="
        relative
        min-h-screen
        overflow-hidden
        pt-30
        md:pt-40
      "
    >
      {/* BG */}
      <div className="absolute inset-0 transform-gpu">
        <Image
          src="/hero-ub.png"
          alt="Ulaanbaatar"
          fill
          priority
          className="
            object-cover
            scale-[1.02]
            md:blur-[10px]
          "
        />
      </div>

      {/* Overlay - Утсан дээр илүү сайн уншигдах үүднээс арай харанхуй болгов */}
      <div
        className="
          absolute
          inset-0
          bg-black/55
          md:bg-black/35
        "
      />

      {/* Orange Glow - Зөвхөн компьютер дээр ажиллана */}
      <div
        className="
          hidden
          md:block
          absolute
          top-[15%]
          left-1/2
          -translate-x-1/2
          w-125
          h-125
          bg-orange-500/10
          blur-[120px]
        "
      />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          min-h-[calc(100vh-120px)]
          md:min-h-[calc(100vh-160px)]
          flex
          items-center
          justify-center
          px-4
          md:px-6
          transform-gpu
        "
      >
        <div
          className="
            max-w-225
            mx-auto
            text-center
          "
        >
          <p
            className="
              text-orange-400
              tracking-[4px]
              md:tracking-[8px]
              font-bold
              text-xs
              md:text-sm
            "
          >
            MONGOLIA • FUTURE OF WORK
          </p>

          <h1
            className="
              mt-6
              md:mt-8
              text-4xl
              md:text-6xl
              font-black
              leading-tight
              md:leading-[1.05]
              text-white
            "
          >
            Хүссэн үедээ
            <br className="hidden md:block" /> ажилла.
            <br />
            <span className="text-orange-400">Хэдхэн минутанд.</span>
          </h1>

          <p
            className="
              mt-6
              md:mt-8
              text-base
              md:text-xl
              leading-7
              md:leading-8
              text-white/90
              max-w-175
              mx-auto
            "
          >
            Монголын ажил хайгч болон ажил олгогчийг нэг платформ дээр хурдан
            бөгөөд найдвартай холбоно.
          </p>

          {/* BUTTONS */}
          <div
            className="
              mt-10
              md:mt-12
              flex
              justify-center
              gap-4
              flex-wrap
            "
          >
            <Link href="/dashboard/staff/jobs" className="w-full sm:w-auto">
              <button
                className="
                  orange-btn
                  w-full
                  sm:w-55
                  h-13.5
                  md:h-15
                  flex
                  items-center
                  justify-center
                  text-sm
                  md:text-base
                "
              >
                Ажил Хайх
              </button>
            </Link>

            <Link href="/dashboard/company/applicants" className="w-full sm:w-auto">
              <button
                className="
                  w-full
                  sm:w-55
                  h-13.5
                  md:h-15
                  rounded-2xl
                  text-white
                  bg-white/10
                  border
                  border-white/20
                  flex
                  items-center
                  justify-center
                  text-sm
                  md:text-base
                  active:translate-y-0
                  md:hover:bg-white/20
                  md:hover:-translate-y-1
                  transition
                  duration-300
                "
              >
                Staff Хайх
              </button>
            </Link>
          </div>

          {/* STATS */}
          <div className="mt-16 flex justify-center gap-5 flex-wrap"></div>
        </div>
      </div>
    </section>
  )
}