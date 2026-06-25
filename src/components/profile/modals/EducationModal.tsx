"use client"

import { useEffect, useState } from "react"

export type Education = {
  school: string
  degree: string
  field: string
  graduationYear: string
  isCurrent?: boolean
}

type Props = {
  open: boolean
  value: Education[]
  onSave: (updatedList: Education[]) => void
  onClose: () => void
}

const initialForm: Education = {
  school: "",
  degree: "",
  field: "",
  graduationYear: "",
  isCurrent: false,
}

export default function EducationModal({ open, value, onSave, onClose }: Props) {
  const [list, setList] = useState<Education[]>([])
  const [form, setForm] = useState<Education>(initialForm)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setList(Array.isArray(value) ? value : [])
      setForm(initialForm)
      setEditingIndex(null)
    }
  }, [open, value])

  if (!open) return null

  const handleAddOrUpdate = () => {
    if (!form.school.trim()) return alert("Сургуулийн нэрийг оруулна уу")
    if (!form.isCurrent && !form.graduationYear.trim()) {
      return alert("Төгссөн оноо оруулна уу эсвэл 'Одоо суралцаж буй' сонголтыг сонгоно уу")
    }

    let updated: Education[]
    const finalForm = {
      ...form,
      graduationYear: form.isCurrent ? "" : form.graduationYear
    }

    if (editingIndex !== null) {
      updated = [...list]
      updated[editingIndex] = finalForm
    } else {
      updated = [...list, finalForm]
    }

    setList(updated)
    setForm(initialForm)
    setEditingIndex(null)
  }

  const handleDelete = (index: number) => {
    setList(list.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setForm(initialForm)
      setEditingIndex(null)
    }
  }

  const handleEdit = (index: number) => {
    setForm(list[index])
    setEditingIndex(index)
  }

  const handleFinalSave = () => {
    onSave(list)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            🎓 Боловсролын мэдээлэл удирдах
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200">✕</button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* ОДОО БАЙГАА ЖАГСААЛТ */}
          {list.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Нэмэгдсэн боловсрол ({list.length})</label>
              <div className="grid grid-cols-1 gap-2">
                {list.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50 border rounded-xl">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{item.school}</h4>
                      <p className="text-xs text-gray-500">
                        {item.degree} {item.field && `— ${item.field}`} 
                        <span className="ml-1.5 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                          {item.isCurrent ? "Одоо суралцаж буй" : `${item.graduationYear} онд төгссөн`}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => handleEdit(idx)} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded-lg font-medium hover:bg-indigo-100">Засах</button>
                      <button type="button" onClick={() => handleDelete(idx)} className="text-xs bg-red-50 text-red-500 px-2.5 py-1.5 rounded-lg font-medium hover:bg-red-100">Устгах</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ФОРМ ОРУУЛАХ ХЭСЭГ */}
          <div className="border border-dashed p-5 rounded-2xl bg-gray-50/50 space-y-4">
            <h3 className="text-sm font-bold text-gray-700">
              {editingIndex !== null ? "📝 Мэдээлэл засах" : "➕ Шинээр боловсрол нэмэх"}
            </h3>
            
            <div>
              <label className="text-xs text-gray-500 block mb-1">Сургуулийн нэр</label>
              <input
                type="text"
                placeholder="Жишээ нь: Монгол Улсын Их Сургууль"
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
                className="w-full border bg-white rounded-xl p-3 text-sm text-gray-800 outline-none focus:border-indigo-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Боловсролын зэрэг</label>
                <input
                  type="text"
                  placeholder="Жишээ нь: Бакалавр, Магистр"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className="w-full border bg-white rounded-xl p-3 text-sm text-gray-800 outline-none focus:border-indigo-50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Мэргэжил / Чиглэл</label>
                <input
                  type="text"
                  placeholder="Жишээ нь: Программын хангамж"
                  value={form.field}
                  onChange={(e) => setForm({ ...form, field: e.target.value })}
                  className="w-full border bg-white rounded-xl p-3 text-sm text-gray-800 outline-none focus:border-indigo-50"
                />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer gap-2 select-none">
                <input
                  type="checkbox"
                  checked={form.isCurrent || false}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, graduationYear: e.target.checked ? "" : form.graduationYear })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-600">Би одоо энэ сургуульд суралцаж байгаа</span>
              </label>

              {!form.isCurrent && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Төгссөн он</label>
                  <input
                    type="text"
                    placeholder="Жишээ нь: 2024"
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                    className="w-full border bg-white rounded-xl p-3 text-sm text-gray-800 outline-none focus:border-indigo-50"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddOrUpdate}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition"
            >
              {editingIndex !== null ? "Өөрчлөлтийг жагсаалтад шинэчлэх" : "Жагсаалтад нэмэх"}
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-6 flex justify-end gap-3 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 border bg-white border-gray-300 text-gray-700 rounded-xl text-sm font-semibold">Цуцлах</button>
          <button
            type="button"
            onClick={handleFinalSave}
            disabled={list.length === 0} // 👈 Хэрэв жагсаалт хоосон бол идэвхгүй болгоно
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all"
          >
            Батлах & Хадгалах ✨
          </button>
        </div>
      </div>
    </div>
  )
}