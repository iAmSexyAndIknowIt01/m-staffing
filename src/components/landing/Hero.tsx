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
          "
        />
      </div>

      {/* Overlay */}
      <div
        className="
          absolute
          inset-0
          bg-black/55
        "
      />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          min-h-[calc(100vh-120px)]
          flex
          items-center
          justify-center
          px-4
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
              font-bold
              text-xs
            "
          >
            MONGOLIA • FUTURE OF WORK
          </p>

          <h1
            className="
              mt-6
              text-4xl
              md:text-6xl
              font-black
              leading-tight
              text-white
            "
          >
            Хүссэн үедээ
            <br /> ажилла.
            <br />
            <span className="text-orange-400">Хэдхэн минутанд.</span>
          </h1>

          <p
            className="
              mt-6
              text-base
              md:text-xl
              leading-7
              md:leading-8
              text-white/90
              max-w-175
              mx-auto
            "
          >
            Монголов ажил хайгч болон ажил олгогчийг нэг платформ дээр хурдан
            бөгөөд найдвартай холбоно.
          </p>

          {/* BUTTONS */}
          <div
            className="
              mt-10
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
                  rounded-2xl
                  text-white
                  bg-white/30 
                  border
                  border-white/20
                  flex
                  items-center
                  justify-center
                  text-sm
                  md:text-base
                  backdrop-blur-none
                  active:translate-y-0
                  
                  /* Bright Glow Эффект */
                  hover:bg-white/95
                  hover:text-gray-900
                  hover:border-white
                  hover:-translate-y-0.5
                  hover:shadow-[0_0_35px_rgba(255,255,255,0.65)]
                  
                  transition-all
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