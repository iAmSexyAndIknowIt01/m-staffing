import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"

// Зураг хуулах цорын ганц зам. Storage bucket-ууд anon бичих эрхгүй тул
// клиент шууд хуулж чадахгүй — энд session, төрөл, хэмжээг шалгаад service_role-оор хуулна.

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

const BUCKETS = {
  avatars: { folder: "avatars" },
  "company-logos": { folder: "logos" },
} as const

type BucketName = keyof typeof BUCKETS

// Content-Type толгойг хуурч болох тул файлын эхний байтуудаар бодит төрлийг шалгана
function matchesMagicBytes(bytes: Uint8Array, mime: string): boolean {
  switch (mime) {
    case "image/png":
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case "image/webp":
      return (
        String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
      )
    default:
      return false
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Нэвтрээгүй байна." }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    const bucket = formData.get("bucket") as BucketName | null

    if (!bucket || !(bucket in BUCKETS)) {
      return NextResponse.json({ success: false, error: "Bucket буруу байна." }, { status: 400 })
    }

    // Компанийн лого зөвхөн компани эсвэл админ хуулна
    if (bucket === "company-logos" && session.role !== "company" && !session.isAdmin) {
      return NextResponse.json({ success: false, error: "Эрх хүрэхгүй байна." }, { status: 403 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Файл олдсонгүй." }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "Зөвхөн PNG, JPG, WEBP зураг хуулах боломжтой." },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Зургийн хэмжээ 2MB-аас ихгүй байх ёстой." },
        { status: 400 }
      )
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!matchesMagicBytes(bytes, file.type)) {
      return NextResponse.json({ success: false, error: "Файлын агуулга зураг биш байна." }, { status: 400 })
    }

    const filePath = `${BUCKETS[bucket].folder}/${session.userId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, bytes, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return NextResponse.json({ success: true, publicUrl })
  } catch (error) {
    console.error("UPLOAD_ERROR:", error)
    return NextResponse.json({ success: false, error: "Зураг хуулахад алдаа гарлаа." }, { status: 500 })
  }
}
