import Image from "next/image"
import Link from "next/link"

export default function Hero() {
  return (
    <section
      className="
        relative
        min-h-screen
        overflow-hidden
        pt-[160px]
      "
    >

      {/* BG */}

      <Image
        src="/hero-ub.png"
        alt="Ulaanbaatar"
        fill
        priority
        className="
          object-cover
          scale-[1.03]
          blur-[10px]
        "
      />

      {/* Overlay */}

      <div
        className="
          absolute
          inset-0
          bg-black/35
        "
      />

      {/* Orange Glow */}

      <div
        className="
          absolute
          top-[15%]
          left-1/2
          -translate-x-1/2

          w-[500px]
          h-[500px]

          bg-orange-500/10
          blur-[120px]
        "
      />

      {/* CONTENT */}

      <div
        className="
          relative
          z-10

          min-h-[calc(100vh-160px)]

          flex
          items-center
          justify-center

          px-6
        "
      >

        <div
          className="
            max-w-[900px]
            mx-auto
            text-center
          "
        >

          <p
            className="
              orange-text
              tracking-[8px]
              font-bold
              text-sm
            "
          >
            MONGOLIA • FUTURE OF WORK
          </p>

          <h1
            className="
              mt-8
              text-4xl
              md:text-6xl
              font-black
              leading-[1.05]
              text-white
            "
          >
            Хүссэн үедээ

            <br />

            ажилла.

            <br />

            <span className="text-orange-400">
              Хэдхэн минутанд.
            </span>

          </h1>

          <p
            className="
              mt-8
              text-lg
              md:text-xl
              leading-8

              text-white/90

              max-w-[700px]
              mx-auto
            "
          >
            Монголын ажил хайгч болон
            ажил олгогчийг нэг платформ дээр
            хурдан бөгөөд найдвартай холбоно.
          </p>

          {/* BUTTONS */}

          <div
            className="
              mt-12
              flex
              justify-center
              gap-5
              flex-wrap
            "
          >

            <Link href="/jobs">

              <button
                className="
                  orange-btn

                  w-[220px]
                  h-[60px]

                  flex
                  items-center
                  justify-center
                "
              >
                Ажил Хайх
              </button>

            </Link>

            <Link href="/staff">

              <button
                className="
                  glass

                  w-[220px]
                  h-[60px]

                  rounded-2xl

                  text-white

                  flex
                  items-center
                  justify-center

                  hover:bg-white/10
                  hover:-translate-y-1

                  transition
                  duration-300
                "
              >
                Staff Хайх
              </button>

            </Link>

          </div>

          {/* STATS */}

          <div
            className="
              mt-16

              flex
              justify-center

              gap-5

              flex-wrap
            "
          >

          </div>

        </div>

      </div>

    </section>
  )
}