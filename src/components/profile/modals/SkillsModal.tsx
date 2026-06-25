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
  const [technical, setTechnical] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])

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
        `/api/skills?q=${techInput}&type=technical`
      )
      const data = await response.json()

      console.log("TECH API:", data)

      if (!Array.isArray(data)) {
        setTechSuggestions([])
        return
      }
      setTechSuggestions(
        data
          .map((item: any) => item.skill_name)
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
        `/api/skills?q=${langInput}&type=language`
      )
      const data = await response.json()

      console.log("LANG API:", data)

      if (!Array.isArray(data)) {
        setLangSuggestions([])
        return
      }

      setLangSuggestions(
        data
          .map((item: any) => item.skill_name)
          .filter((skill: string) => !languages.includes(skill))
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [langInput, languages])

  function addTechnical() {
    if (!techInput.trim()) return
    setTechnical([...technical, techInput.trim()])
    setTechInput("")
  }

  function addLanguage() {
    if (!langInput.trim()) return
    setLanguages([...languages, langInput.trim()])
    setLangInput("")
  }

  useEffect(() => {
    if (open) {
      setTechnical(value.technical || [])
      setLanguages(value.languages || [])
    }
  }, [open, value])

  if (!open) return null

  // Техникийн болон Хэлний мэдлэг хоёулаа хоосон эсэхийг шалгах нөхцөл
  const isDisabled = technical.length === 0 && languages.length === 0

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            🛠️ Ур чадвар засах
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {techSuggestions.length > 0 && (
              <div className="mt-2 border rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">
                {techSuggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setTechnical([...technical, skill])
                      setTechInput("")
                      setTechSuggestions([])
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b text-sm last:border-b-0"
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
                  className="flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium"
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
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {langSuggestions.length > 0 && (
              <div className="mt-2 border rounded-xl bg-white shadow-sm max-h-48 overflow-y-auto">
                {langSuggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setLanguages([...languages, skill])
                      setLangInput("")
                      setLangSuggestions([])
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-green-50 border-b text-sm last:border-b-0"
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
                  className="flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-green-50 text-green-700 text-sm font-medium"
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

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
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
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all"
          >
            Хадгалах ✨
          </button>
        </div>

      </div>
    </div>
  )
}