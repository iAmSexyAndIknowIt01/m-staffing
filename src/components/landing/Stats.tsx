const data = [
  ["100+", "Байгууллага"],
  ["5000+", "Ажил Хайгч"],
  ["24/7", "Холболт"],
]

export default function Stats() {
  return (
    <section className="section">
      <div className="grid md:grid-cols-3 gap-6">
        {data.map((i) => (
          <div
            key={i[0]}
            className="
              glass
              rounded-3xl
              p-10
            "
          >
            <h2
              className="
                text-5xl
                orange-text
              "
            >
              {i[0]}
            </h2>

            <p className="mt-2">
              {i[1]}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}