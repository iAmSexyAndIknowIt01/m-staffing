"use client"

import { Wrench, X } from "lucide-react"
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

function SkillsModalContent({
  value,
  onSave,
  onClose,
}: Props) {
  const [technical, setTechnical] = useState<string[]>(value.technical || [])
  const [languages, setLanguages] = useState<string[]>(value.languages || [])

  const [techInput, setTechInput] = useState("")
  const [langInput, setLangInput] = useState("")

  const [techSuggestions, setTechSuggestions] = useState<string[]>([])
  const [langSuggestions, setLangSuggestions] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!techInput.trim()) {
        setTechSuggestions([])
        return
      }

      const response = await fetch(
        `/api/skills?q=${encodeURIComponent(techInput)}&type=technical`
      )
      const data = await response.json()


      if (!Array.isArray(data)) {
        setTechSuggestions([])
        return
      }
      setTechSuggestions(
        data
          .map((item) => item.skill_name)
          .filter((skill: string) => !technical.includes(skill))
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [techInput, technical])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!langInput.trim()) {
        setLangSuggestions([])
        return
      }

      const response = await fetch(
        `/api/skills?q=${encodeURIComponent(langInput)}&type=languages`
      )
      const data = await response.json()


      if (!Array.isArray(data)) {
        setLangSuggestions([])
        return
      }

      setLangSuggestions(
        data
          .map((item) => item.skill_name)
          .filter((skill: string) => !languages.includes(skill))
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [langInput, languages])

  // Техникийн болон Хэлний мэдлэг хоёулаа хоосон эсэхийг шалгах нөхцөл
  const isDisabled = technical.length === 0 && languages.length === 0

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            <Wrench size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" /> Ур чадвар засах
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Technical */}
          <div>
            <h3 className="font-bold text-sm text-gray-700 mb-2">
              Техникийн ур чадвар
            </h3>
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="Java, React, Figma ..."
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </div>

            {techSuggestions.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">
                {techSuggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setTechnical([...technical, skill])
                      setTechInput("")
                      setTechSuggestions([])
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-orange-50 border-b border-gray-100 text-sm last:border-b-0"
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
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTechnical(technical.filter((s) => s !== skill))
                    }
                    className="text-red-500 font-bold hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h3 className="font-bold text-sm text-gray-700 mb-2">
              Хэлний мэдлэг
            </h3>
            <div className="flex gap-2">
              <input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                placeholder="English, 日本語, Монгол хэл ..."
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </div>

            {langSuggestions.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">
                {langSuggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setLanguages([...languages, skill])
                      setLangInput("")
                      setLangSuggestions([])
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-green-50 border-b border-gray-100 text-sm last:border-b-0"
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
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-green-50 text-green-700 text-sm font-medium"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLanguages(languages.filter((l) => l !== lang))
                    }
                    className="text-red-500 font-bold hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border bg-white border-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition hover:bg-gray-50"
          >
            Цуцлах
          </button>
          <button
            type="button"
            disabled={isDisabled} // 👈 Ур чадварууд хоосон үед идэвхгүй болно
            onClick={() => {
              onSave({
                technical,
                languages,
              })
              onClose()
            }}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all"
          >
            Хадгалах
          </button>
        </div>

      </div>
    </div>
  )
}

// Модал нээгдэх бүрд дотоод state-ийг props-оос шинээр эхлүүлэхийн тулд зөвхөн нээлттэй үед mount хийнэ
export default function SkillsModal(props: Props) {
  if (!props.open) return null
  return <SkillsModalContent {...props} />
}
