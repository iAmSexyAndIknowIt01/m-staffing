"use client"

import { useEffect, useState } from "react"

type Props = {
  open: boolean
  value: {
    technical: string[]
    languages: string[]
  }
  onSave: (value: {
    technical: string[]
    languages: string[]
  }) => void
  onClose: () => void
}

export default function SkillsModal({
  open,
  value,
  onSave,
  onClose,
}: Props) {

  const [technical, setTechnical] =
    useState<string[]>([])

  const [languages, setLanguages] =
    useState<string[]>([])

  const [techInput, setTechInput] =
    useState("")

  const [langInput, setLangInput] =
    useState("")

  const [techSuggestions, setTechSuggestions] =
    useState<string[]>([])

  const [langSuggestions, setLangSuggestions] =
    useState<string[]>([])

  useEffect(() => {

    const timer = setTimeout(async () => {

      if (!techInput.trim()) {

        setTechSuggestions([])

        return
      }

      const response =
        await fetch(
          `/api/skills?q=${techInput}&type=technical`
        )

      const data =
        await response.json()

      console.log("TECH API:", data)

      if (!Array.isArray(data)) {
        setTechSuggestions([])
        return
      }
      setTechSuggestions(
        data
          .map(
            (item: any) =>
              item.skill_name
          )
          .filter(
            (skill: string) =>
              !technical.includes(skill)
          )
      )

    }, 300)

    return () =>
      clearTimeout(timer)

  }, [techInput, technical])

  useEffect(() => {

    const timer = setTimeout(async () => {

      if (!langInput.trim()) {

        setLangSuggestions([])

        return
      }

      const response =
        await fetch(
          `/api/skills?q=${langInput}&type=language`
        )

      const data =
        await response.json()

      console.log("LANG API:", data)

      if (!Array.isArray(data)) {
        setLangSuggestions([])
        return
      }

      setLangSuggestions(
        data
            .map(
              (item: any) =>
                item.skill_name
            )
            .filter(
              (skill: string) =>
                !languages.includes(skill)
            )
      )

    }, 300)

    return () =>
      clearTimeout(timer)

  }, [langInput, languages])


  function addTechnical() {

    if (!techInput.trim()) return

    setTechnical([
      ...technical,
      techInput.trim(),
    ])

    setTechInput("")
  }

  function addLanguage() {

    if (!langInput.trim()) return

    setLanguages([
      ...languages,
      langInput.trim(),
    ])

    setLangInput("")
  }
  useEffect(() => {
    if (open) {
      setTechnical(value.technical || [])
      setLanguages(value.languages || [])
    }
  }, [open, value])

  if (!open) return null

  return (
    
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

      <div className="bg-white w-full max-w-3xl rounded-3xl">

        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">
            Ур чадвар засах
          </h2>
        </div>

        <div className="p-6 space-y-6">

          {/* Technical */}

          <div>
            <h3 className="font-bold mb-3">
              Техникийн ур чадвар
            </h3>

            <div className="flex gap-2">

              <input
                value={techInput}
                onChange={(e) =>
                  setTechInput(e.target.value)
                }
                placeholder="Java, React ..."
                className="flex-1 border rounded-xl px-3 py-2"
              />

              {/* <button
                type="button"
                onClick={addTechnical}
                disabled={
                  !techSuggestions.includes(
                    techInput.trim()
                  )
                }
                className={`
                  px-4 py-2 rounded-xl text-white
                  ${
                    techSuggestions.includes(
                      techInput.trim()
                    )
                      ? "bg-indigo-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }
                `}
              >
                Нэмэх
              </button> */}

            </div>


            {techSuggestions.length > 0 && (
              <div className="mt-2 border rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">

                {techSuggestions.map((skill) => (

                  <button
                    key={skill}
                    type="button"
                    onClick={() => {

                      setTechnical([
                        ...technical,
                        skill,
                      ])

                      setTechInput("")
                      setTechSuggestions([])

                    }}
                    className="
                      w-full
                      text-left
                      px-4
                      py-2
                      hover:bg-indigo-50
                      border-b
                      last:border-b-0
                    "
                  >
                    {skill}
                  </button>

                ))}



              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">

              {technical.map((skill) => (
                <div
                  key={skill}
                  className="
                    flex items-center gap-2
                    px-3 py-2
                    border rounded-lg
                    bg-indigo-50
                  "
                >
                  <span>{skill}</span>

                  <button
                    type="button"
                    onClick={() =>
                      setTechnical(
                        technical.filter(
                          (s) => s !== skill
                        )
                      )
                    }
                    className="
                      text-red-500
                      font-bold
                      hover:text-red-700
                    "
                  >
                    ×
                  </button>

                </div>
              ))}

            </div>
          </div>

          {/* Languages */}

          <div>
            <h3 className="font-bold mb-3">
              Хэлний мэдлэг
            </h3>

            <div className="flex gap-2">

              <input
                value={langInput}
                onChange={(e) =>
                  setLangInput(e.target.value)
                }
                placeholder="English, 日本語 ..."
                className="flex-1 border rounded-xl px-3 py-2"
              />

              {/* <button
                type="button"
                onClick={addLanguage}
                disabled={
                  !langSuggestions.includes(
                    langInput.trim()
                  )
                }
                className={`
                  px-4 py-2 rounded-xl text-white
                  ${
                    langSuggestions.includes(
                      langInput.trim()
                    )
                      ? "bg-indigo-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }
                `}
              >
                Нэмэх
              </button> */}

            </div>

            {langSuggestions.length > 0 && (
              <div className="mt-2 border rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">

                {langSuggestions.map((skill) => (

                  <button
                    key={skill}
                    type="button"
                    onClick={() => {

                      setLanguages([
                        ...languages,
                        skill,
                      ])

                      setLangInput("")
                      setLangSuggestions([])

                    }}
                    className="
                      w-full
                      text-left
                      px-4
                      py-2
                      hover:bg-indigo-50
                      border-b
                      last:border-b-0
                    "
                  >
                    {skill}
                  </button>

                ))}

              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">

              {languages.map((lang) => (
                <div
                  key={lang}
                  className="
                    flex items-center gap-2
                    px-3 py-2
                    border rounded-lg
                    bg-green-50
                  "
                >
                  <span>{lang}</span>

                  <button
                    type="button"
                    onClick={() =>
                      setLanguages(
                        languages.filter(
                          (l) => l !== lang
                        )
                      )
                    }
                    className="
                      text-red-500
                      font-bold
                      hover:text-red-700
                    "
                  >
                    ×
                  </button>

                </div>
              ))}

            </div>
          </div>

        </div>

        <div className="p-6 border-t flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-xl"
          >
            Цуцлах
          </button>

          <button
            type="button"
            onClick={() => {
              onSave({
                technical,
                languages,
              });
              onClose();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
          >
            Хадгалах
          </button>

        </div>

      </div>

    </div>
  )
}