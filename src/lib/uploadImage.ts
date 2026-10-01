// Клиент компонентоос зураг хуулах — /api/upload-аар дамжуулна (storage руу шууд хандахгүй)
export async function uploadImage(file: File, bucket: "avatars" | "company-logos"): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("bucket", bucket)

  const res = await fetch("/api/upload", { method: "POST", body: formData })
  const result = await res.json()

  if (!res.ok || !result.success) {
    throw new Error(result.error || "Зураг хуулахад алдаа гарлаа.")
  }

  return result.publicUrl as string
}
