export default function Hero() {
  return (
    <section className="min-h-screen pt-[180px]">
      <div
        className="
          max-w-[1280px]
          mx-auto
          px-6
          text-center
        "
      >
        <p
          className="
            orange-text
            font-bold
            tracking-[6px]
          "
        >
          МОНГОЛЫН ИРЭЭДҮЙН АЖИЛ
        </p>

        <h1
          className="
            mt-8
            text-5xl
            md:text-8xl
            font-black
            leading-[1]
          "
        >
          Өөрийн

          <br />

          Дараагийн Ажлаа

          <br />

          <span className="orange-text">
            Хэдхэн Минутанд
          </span>
        </h1>

        <p
          className="
            mt-10
            text-gray-600
            text-xl
            max-w-3xl
            mx-auto
          "
        >
          Монголын цагийн ажил хайгч болон
          ажил олгогчийг нэг платформ дээр
          хурдан бөгөөд найдвартай холбоно.
        </p>

        <div
          className="
            mt-14
            flex
            justify-center
            gap-5
          "
        >
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
    </section>
  )
}