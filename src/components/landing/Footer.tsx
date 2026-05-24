export default function Footer() {
  return (
    <footer className="section pb-10">

      <div
        className="
        glass

        rounded-[48px]

        p-10

        md:p-16
      "
      >

        <div
          className="
          grid

          md:grid-cols-4

          gap-14
        "
        >

          {/* BRAND */}

          <div>

            <h2
              className="
              text-4xl

              font-black

              orange-text
            "
            >
              MStaffing
            </h2>

            <p
              className="
              mt-6

              text-gray-500

              leading-8
            "
            >
              Монголын цагийн ажил хайгч
              болон ажил олгогчдыг
              хурдан бөгөөд найдвартай
              холбох платформ.
            </p>

          </div>

          {/* LINKS */}

          <div>

            <h3 className="font-black">
              Платформ
            </h3>

            <div
              className="
              mt-6

              flex

              flex-col

              gap-4

              text-gray-500
            "
            >

              <a className="hover:text-orange-500">
                Ажил Хайх
              </a>

              <a className="hover:text-orange-500">
                Ажилтан Авах
              </a>

              <a className="hover:text-orange-500">
                Бүртгүүлэх
              </a>

            </div>

          </div>

          {/* COMPANY */}

          <div>

            <h3 className="font-black">
              Компани
            </h3>

            <div
              className="
              mt-6

              flex

              flex-col

              gap-4

              text-gray-500
            "
            >

              <a className="hover:text-orange-500">
                Бидний тухай
              </a>

              <a className="hover:text-orange-500">
                Холбоо барих
              </a>

              <a className="hover:text-orange-500">
                Түгээмэл асуулт
              </a>

            </div>

          </div>

          {/* CTA */}

          <div>

            <h3
              className="
              font-black
            "
            >
              Өнөөдөр эхэл
            </h3>

            <p
              className="
              mt-6

              text-gray-500
            "
            >
              Хэдхэн минутын дотор
              шинэ боломжтой холбоорой.
            </p>

            <button
              className="
              orange-btn

              mt-8
            "
            >
              Үнэгүй Эхлэх
            </button>

          </div>

        </div>

        {/* BOTTOM */}

        <div
          className="
          mt-14

          pt-8

          border-t

          border-orange-100

          flex

          flex-col

          md:flex-row

          justify-between

          items-center

          gap-5
        "
        >

          <div className="text-gray-500">
            © 2026 MStaffing
          </div>

          <div
            className="
            flex

            gap-8

            text-gray-500
          "
          >

            <a className="hover:text-orange-500">
              Үйлчилгээний нөхцөл
            </a>

            <a className="hover:text-orange-500">
              Нууцлал
            </a>

          </div>

        </div>

      </div>

    </footer>
  )
}