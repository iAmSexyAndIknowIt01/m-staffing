// Supabase-ийн embed хийсэн many-to-one холбоос (жишээ нь tr_job_request → mt_openjob)
// runtime дээр объект ирдэг ч төрөлгүй client үүнийг массив гэж таамагладаг.
// Аль ч хэлбэрээр ирсэн нэг мөр (эсвэл null) болгож буцаана.
export function one<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null
  return relation ?? null
}
