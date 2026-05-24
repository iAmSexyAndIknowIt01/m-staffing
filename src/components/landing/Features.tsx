export default function Features() {
  const items = [
    "Ухаалаг Холболт",
    "Хурдан Бүртгэл",
    "Баталгаатай Байгууллага",
    "Шууд Ажилд Орох",
  ]

  return (
    <section className="section">
      <h2
        className="
          text-5xl
          font-bold
          text-center
        "
      >
        Орчин Үеийн

        <span className="orange-text">
          {" "}Ажил Хайлтад
        </span>
      </h2>

      <div
        className="
          grid
          md:grid-cols-2
          gap-6
          mt-12
        "
      >
        {items.map((i) => (
          <div
            key={i}
            className="
              glass
              rounded-3xl
              p-10
            "
          >
            {i}
          </div>
        ))}
      </div>
    </section>
  )
}