import Image from "next/image"

export default function Hero() {
  return (
    <section className="min-h-screen pt-[170px]">
      <div
        className="
        max-w-[1400px]
        mx-auto
        px-6
        grid
        lg:grid-cols-2
        gap-20
        items-center
      "
      >
        {/* LEFT */}

        <div>
          {/* <p
            className="
            orange-text
            font-bold
            tracking-[6px]
          "
          >
            МОНГОЛЫН ЦАГИЙН АЖЛЫН ПЛАТФОРМ
          </p> */}

          <h1
            className="
            mt-8
            text-5xl
            md:text-7xl
            font-black
            leading-[1]
          "
          >
            Хүссэн үедээ

            <br />

            Ажилла.

            <br />

            <span className="orange-text">
              Хэдхэн минутанд.
            </span>
          </h1>

          <p
            className="
            mt-10
            text-gray-600
            text-xl
            max-w-xl
          "
          >
            Монголын ажил хайгч болон
            ажил олгогчийг хурдан бөгөөд
            найдвартай холбодог платформ.
          </p>

          <div className="mt-12 flex gap-5">
            <button className="orange-btn">
              Ажил Хайх
            </button>

            <button
              className="
              glass
              px-8
              py-4
              rounded-2xl
            "
            >
              Ажилтан Авах
            </button>
          </div>
        </div>

        {/* RIGHT */}

        <div className="relative">

          <div
            className="
            glass
            rounded-[50px]
            p-8
            relative
            overflow-hidden
          "
          >
            <Image
              src="/hero-worker.png"
              alt="MStaffing Hero"
              width={1600}
              height={1600}
              className="
                w-full
                h-auto
                object-contain

                -translate-x-10

                lg:-translate-x-20
              "
            />

            {/* Bubble */}

            <div
              className="
              absolute
              top-10
              right-10
              bg-orange-500
              text-white
              rounded-[30px]
              px-8
              py-6
              shadow-2xl
            "
            >
              <div className="text-4xl font-black">
                10,000+
              </div>

              <div>
                Ажил хайгч
              </div>
            </div>

            <div
              className="
              absolute
              bottom-10
              left-10
              bg-white
              rounded-[30px]
              px-8
              py-6
              shadow-xl
            "
            >
              <div
                className="
                text-4xl
                font-black
                orange-text
              "
              >
                24/7
              </div>

              <div>
                Шууд холболт
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}