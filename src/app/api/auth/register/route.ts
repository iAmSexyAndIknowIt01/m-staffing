import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role, firstName, lastName, companyName, email, password } = body

    if (!role || !email || !password) {
      return NextResponse.json({ message: "Мэдээлэл дутуу байна" }, { status: 400 })
    }

    if (role === "staff" && (!firstName || !lastName)) {
      return NextResponse.json({ message: "Овог нэр шаардлагатай" }, { status: 400 })
    }

    if (role === "company" && !companyName) {
      return NextResponse.json({ message: "Компанийн нэр шаардлагатай" }, { status: 400 })
    }

    // 1. Supabase Auth руу бүртгэнэ (Энэ үед имэйл автоматаар илгээгдэнэ)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
        },
        // Хэрэглэгч имэйл дээрээ дараад буцаж ирэх линк (Өөрийнхөөрөө солиорой)
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    const user = data.user
    if (!user) {
      return NextResponse.json({ message: "Хэрэглэгч үүссэнгүй" }, { status: 500 })
    }

    // 2. Хэрэв имэйл баталгаажуулалт идэвхтэй бөгөөд identities хоосон байвал (Имэйл баталгаажихыг хүлээж буй төлөв)
    // Энэ үед шууд insert хийвэл Foreign Key алдаа зааж магадгүй тул шалгана.
    if (data.session === null) {
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Бүртгэл амжилттай. Баталгаажуулах имэйлийг таны хаяг руу илгээлээ. Имэйлээ шалгана уу.",
      })
    }

    // 3. Хэрэв танай Supabase дээр Email Verification унтраалтай байвал хуучин логикоор шууд insert хийнэ
    if (role === "staff") {
      await supabase.from("mt_staff").insert({ id: user.id, first_name: firstName, last_name: lastName, email })
      await supabase.from("mt_profile").insert({ user_id: user.id, email, phone: "", bio: "", skills: "", experience: "", education: "" })
    } else if (role === "company") {
      await supabase.from("mt_company").insert({ id: user.id, company_name: companyName, email })
    }

    return NextResponse.json({
      success: true,
      requiresVerification: false,
      redirect: "/login",
    })

  } catch (err) {
    console.log(err)
    return NextResponse.json({ message: "Системийн алдаа" }, { status: 500 })
  }
}