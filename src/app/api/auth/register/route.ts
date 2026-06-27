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

    // 2. Хэрэв имэйл баталгаажуулалт идэвхтэй бөгөөд identities хоосон байвал
    if (data.session === null) {
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Бүртгэл амжилттай. Баталгаажуулах имэйлийг таны хаяг руу илгээлээ. Имэйлээ шалгана уу.",
      })
    }

    // 3. Хэрэв Supabase дээр Email Verification унтраалтай байвал шууд insert хийнэ
    if (role === "staff") {
      await supabase.from("mt_staff").insert({ id: user.id, first_name: firstName, last_name: lastName, email })
      await supabase.from("mt_profile").insert({ user_id: user.id, email, phone: "", bio: "", skills: "", experience: "", education: "" })
    } else if (role === "company") {
      // А) Компанийн үндсэн мэдээллийг оруулна
      const { error: companyError } = await supabase
        .from("mt_company")
        .insert({ id: user.id, company_name: companyName, email })

      if (companyError) throw companyError

      // Б) 🔥 ШИНЭЧЛЭЛТ: Тухайн компанид зориулж default (Free) багцыг үүсгэнэ
      const { error: subError } = await supabase
        .from("mt_company_subscriptions")
        .insert({
          user_id: user.id,
          plan_type: "free",    // Үнэгүй багц
          status: "active",     // Төлөв: Идэвхтэй
          job_limit: 10,         // Зарлах ажлын байрны лимит
          expires_at: null      // Хугацаагүй (Үнэгүй багц тул)
        })

      if (subError) {
        console.error("Subscription үүсгэхэд алдаа гарлаа:", subError)
        // Тэмдэглэл: Компани амжилттай үүссэн ч багц дээр алдаа гарвал 
        // dashboard API өөрөө default датаг буцаадаг хамгаалалттай байгаа.
      }
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