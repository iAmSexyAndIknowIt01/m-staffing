import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// mailAuth PUT-ээр баталгаажсанаас хойш энэ хугацаанд бүртгэлээ дуусгах ёстой
const VERIFIED_TTL_MS = 15 * 60 * 1000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { role, firstName, lastName, companyName, password } = body
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!role || !email || !password) {
      return NextResponse.json({ message: "Мэдээлэл дутуу байна" }, { status: 400 })
    }

    if (role !== "staff" && role !== "company") {
      return NextResponse.json({ message: "Хэрэглэгчийн төрөл буруу байна" }, { status: 400 })
    }

    if (role === "staff" && (!firstName || !lastName)) {
      return NextResponse.json({ message: "Овог нэр шаардлагатай" }, { status: 400 })
    }

    if (role === "company" && !companyName) {
      return NextResponse.json({ message: "Компанийн нэр шаардлагатай" }, { status: 400 })
    }

    // 0. Имэйл кодоор баталгаажсан эсэхийг серверт шалгана.
    // Ингэхгүй бол энэ API-г шууд дуудаж баталгаажуулалтыг алгасах боломжтой.
    const { data: verification } = await supabase
      .from("register_auth")
      .select("verified_at")
      .eq("mail", email)
      .not("verified_at", "is", null)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!verification || Date.now() - new Date(verification.verified_at).getTime() > VERIFIED_TTL_MS) {
      return NextResponse.json(
        { message: "Имэйл баталгаажаагүй байна. Дахин код авч баталгаажуулна уу." },
        { status: 403 }
      )
    }

    // 1. Supabase Auth руу бүртгэнэ. Имэйлийг манай кодоор аль хэдийн
    // баталгаажуулсан тул email_confirm: true — Supabase дахин имэйл илгээхгүй.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
      },
    })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    const user = data.user
    if (!user) {
      return NextResponse.json({ message: "Хэрэглэгч үүссэнгүй" }, { status: 500 })
    }

    // Баталгаажуулах кодыг дахин ашиглахгүйн тулд устгана
    await supabase.from("register_auth").delete().eq("mail", email)

    // 2. Профайлын хүснэгтүүдийг үүсгэнэ
    if (role === "staff") {
      await supabase.from("mt_staff").insert({ id: user.id, first_name: firstName, last_name: lastName, email })
      await supabase.from("mt_profile").insert({ user_id: user.id, email, phone: "", bio: "", skills: "", experience: "", education: "" })
    } else {
      // А) Компанийн үндсэн мэдээллийг оруулна
      const { error: companyError } = await supabase
        .from("mt_company")
        .insert({ id: user.id, company_name: companyName, email })

      if (companyError) throw companyError

      // Б) Тухайн компанид зориулж default (Free) багцыг үүсгэнэ
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
    console.error("REGISTER_ERROR:", err)
    return NextResponse.json({ message: "Системийн алдаа" }, { status: 500 })
  }
}
