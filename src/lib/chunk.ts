// PostgREST-ийн .in() шүүлтүүр URL-д ордог тул олон зуун ID нэг дор явуулбал
// URL хэт урт болж алдаа өгнө. ID-уудыг хэсэгчлэн query хийж үр дүнг нэгтгэнэ.

export const IN_CHUNK_SIZE = 100

export function chunk<T>(items: T[], size = IN_CHUNK_SIZE): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size))
  return result
}

export async function selectInChunks<Row>(
  ids: string[],
  query: (ids: string[]) => PromiseLike<{ data: Row[] | null; error: unknown }>
): Promise<Row[]> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return []

  const results = await Promise.all(chunk(unique).map((part) => query(part)))
  const rows: Row[] = []
  for (const { data, error } of results) {
    if (error) throw error
    if (data) rows.push(...data)
  }
  return rows
}
