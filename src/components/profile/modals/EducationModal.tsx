"use client"

import { Pencil, Trash2, X } from "lucide-react"
import { useState } from "react"
import { showConfirm } from "@/components/common/AppDialog"

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

const MAX_YEAR = new Date().getFullYear() + 10

// Ажлын туршлагын модалтай (ExperienceModal) ижил бүтэц: жагсаалт <-> нэмэх/засах форм
function EducationModalContent({ value, onSave, onClose }: Props) {
  const [list, setList] = useState<Education[]>(Array.isArray(value) ? value : [])
  const [form, setForm] = useState<Education>(initialForm)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const resetForm = () => {
    setForm(initialForm)
    setEditingIndex(null)
    setShowForm(false)
  }

  const handleAddOrUpdateToList = (e: React.FormEvent) => {
    e.preventDefault()

    const itemData: Education = {
      ...form,
      school: form.school.trim(),
      degree: form.degree.trim(),
      field: form.field.trim(),
      graduationYear: form.isCurrent ? "" : form.graduationYear,
    }

    if (editingIndex !== null) {
      const updated = [...list]
      updated[editingIndex] = itemData
      setList(updated)
    } else {
      setList([...list, itemData])
    }

    resetForm()
  }

  const handleDeleteItem = async (index: number) => {
    if (await showConfirm("Энэ боловсролын мэдээллийг устгахдаа итгэлтэй байна уу?", { title: "Боловсрол устгах", confirmLabel: "Устгах", danger: true })) {
      setList(list.filter((_, idx) => idx !== index))
    }
  }

  const handleEditItem = (index: number) => {
    setForm({ ...initialForm, ...list[index] })
    setEditingIndex(index)
    setShowForm(true)
  }

  const handleFinalSave = () => {
    onSave(list)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* ТОЛГОЙ */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Боловсрол удирдах</h2>
            <p className="text-xs text-gray-400 mt-0.5">Нийт {list.length} боловсрол нэмэгдсэн байна</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
          >
            <X size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" />
          </button>
        </div>

        {/* БӨДӨН */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {!showForm ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Боловсролын жагсаалт</span>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  + Шинэ боловсрол нэмэх
                </button>
              </div>

              {list.length > 0 ? (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {list.map((item, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-2xl p-4 bg-gray-50 flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm break-words">{item.school}</h4>
                        {(item.degree || item.field) && (
                          <p className="text-xs text-orange-600 font-medium break-words">
                            {item.degree}
                            {item.degree && item.field ? " — " : ""}
                            {item.field}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {item.isCurrent ? "Одоо суралцаж буй" : `${item.graduationYear} онд төгссөн`}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditItem(idx)}
                          className="w-7 h-7 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg flex items-center justify-center text-xs"
                          title="Засах"
                          aria-label="Засах"
                        >
                          <Pencil size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="w-7 h-7 bg-white border border-red-100 hover:bg-red-50 rounded-lg flex items-center justify-center text-xs text-red-500"
                          title="Устгах"
                          aria-label="Устгах"
                        >
                          <Trash2 size="1em" className="inline-block shrink-0 align-[-0.125em]" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-gray-200 border-dashed rounded-2xl p-8 text-center text-gray-400 text-sm bg-gray-50">
                  Одоогоор боловсролын мэдээлэл нэмэгдээгүй байна.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddOrUpdateToList} className="space-y-4 border border-orange-100 bg-orange-50/30 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIndex !== null ? "Боловсрол засах" : "Шинэ боловсрол оруулах"}
              </h3>

              <div>
                <label className="text-xs text-gray-500 block mb-1 font-semibold">Сургуулийн нэр *</label>
                <input
                  type="text"
                  required
                  placeholder="Жишээ нь: Монгол Улсын Их Сургууль"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="w-full border border-gray-200 bg-white rounded-xl p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-semibold">Боловсролын зэрэг</label>
                  <input
                    type="text"
                    placeholder="Жишээ нь: Бакалавр, Магистр"
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    className="w-full border border-gray-200 bg-white rounded-xl p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-semibold">Мэргэжил / Чиглэл</label>
                  <input
                    type="text"
                    placeholder="Жишээ нь: Программын хангамж"
                    value={form.field}
                    onChange={(e) => setForm({ ...form, field: e.target.value })}
                    className="w-full border border-gray-200 bg-white rounded-xl p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-500 font-semibold">Төгссөн он{form.isCurrent ? "" : " *"}</label>
                    <label className="flex items-center gap-1 text-xs text-orange-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isCurrent || false}
                        onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                        className="rounded border-gray-300 text-orange-600"
                      />
                      Одоо суралцаж байгаа
                    </label>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1950}
                    max={MAX_YEAR}
                    placeholder="Жишээ нь: 2024"
                    disabled={form.isCurrent}
                    required={!form.isCurrent}
                    value={form.isCurrent ? "" : form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                    className="w-full border border-gray-200 bg-white rounded-xl p-2.5 text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs font-medium"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  {editingIndex !== null ? "Жагсаалтад шинэчлэх" : "Жагсаалтад нэмэх"}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* ХӨЛ */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
          >
            Хаах
          </button>
          {!showForm && (
            <button
              type="button"
              onClick={handleFinalSave}
              disabled={list.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <span className="sm:hidden">Хадгалах</span>
              <span className="hidden sm:inline">Өөрчлөлтийг баталгаажуулж хадгалах</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// Модал нээгдэх бүрд дотоод state-ийг props-оос шинээр эхлүүлэхийн тулд зөвхөн нээлттэй үед mount хийнэ
export default function EducationModal(props: Props) {
  if (!props.open) return null
  return <EducationModalContent {...props} />
}
