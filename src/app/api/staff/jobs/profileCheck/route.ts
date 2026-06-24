import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай байна." }, { status: 401 })
    }

    // ЗАССАН: .eq("id", userId)-ийг .eq("user_id", userId) болгов
    const { data: profile, error: profileError } = await supabase
      .from("mt_profile")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle() // single() нь дата олдохгүй үед 406 алдаа шиддэг тул maybeSingle() ашиглах нь найдвартай

    if (profileError || !profile) {
      return NextResponse.json({ 
        isComplete: false, 
        error: "Профайл мэдээлэл олдсонгүй. Та эхлээд профайлаа үүсгэнэ үү." 
      })
    }

    // ЗАССАН: Таны mt_profile хүснэгтийн бодит багануудын нэрсээр солив
    const requiredFields = [
      "email", 
      "phone", 
      "bio", 
      "skills", 
      "experience", 
      "education"
    ]

    // Хоосон, null эсвэл зөвхөн space (зай) авсан талбаруудыг шүүнэ
    const incompleteFields = requiredFields.filter(field => {
      const value = profile[field]
      return value === null || value === undefined || String(value).trim() === ""
    })

    // Хэрэв аль нэг багана нь бөглөгдөөгүй хоосон байвал
    if (incompleteFields.length > 0) {
      return NextResponse.json({ 
        isComplete: false, 
        error: "Анкет илгээхийн тулд профайл мэдээллээ (Имэйл, Утас, Танилцуулга, Ур чадвар, Туршлага, Боловсрол) бүрэн бөглөнө үү." 
      })
    }

    // Бүх зүйл амжилттай бөглөгдсөн бол
    return NextResponse.json({ isComplete: true })

  } catch (error: any) {
    console.error("Profile Check Error:", error)
    return NextResponse.json({ error: "Серверт алдаа гарлаа." }, { status: 500 })
  }
}