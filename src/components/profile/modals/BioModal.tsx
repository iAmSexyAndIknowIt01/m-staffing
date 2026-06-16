"use client"

type Props = {
  open: boolean
  value: string
  onSave: (value: string) => void
  onClose: () => void
}

export default function BioModal({
  open,
  value,
  onSave,
  onClose,
}: Props) {

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-3xl rounded-3xl">

        <div className="p-6 border-b flex justify-between">

          <h2 className="text-3xl font-bold">
            🚀 Bio засах
          </h2>

          <button onClick={onClose}>
            ✕
          </button>

        </div>

        <div className="p-6">

          <textarea
            defaultValue={value}
            rows={10}
            id="bio-editor"
            className="
              w-full
              border
              border-gray-200
              rounded-2xl
              p-4
            "
          />

        </div>

        <div className="border-t p-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-5 py-3 bg-gray-100 rounded-xl"
          >
            Цуцлах
          </button>

          <button
            onClick={() => {

              const value =
                (
                  document.getElementById(
                    "bio-editor"
                  ) as HTMLTextAreaElement
                ).value

              onSave(value)

            }}
            className="
              px-5
              py-3
              bg-indigo-600
              text-white
              rounded-xl
            "
          >
            Хадгалах
          </button>

        </div>

      </div>

    </div>
  )
}