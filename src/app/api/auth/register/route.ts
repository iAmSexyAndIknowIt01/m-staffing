import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { PLANS } from "@/lib/plans"
import { validateNewPassword } from "@/lib/password"

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

    // Нууц үг сэргээхтэй ижил шаардлага (Supabase-ийн анхдагч 6 тэмдэгтээс хатуу)
    const passwordError = validateNewPassword(password)
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 })
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
      // DB-ийн дотоод мессежийг клиент рүү дамжуулахгүй
      const message =
        error.code === "email_exists" || error.code === "user_already_exists"
          ? "Энэ имэйл хаяг бүртгэгдсэн байна."
          : error.code === "weak_password"
            ? "Нууц үг хэт сул байна. Илүү урт, нийлмэл нууц үг оруулна уу."
            : "Бүртгэл үүсгэхэд алдаа гарлаа."
      console.error("REGISTER_CREATE_USER_ERROR:", error)
      return NextResponse.json({ message }, { status: 400 })
    }

    const user = data.user
    if (!user) {
      return NextResponse.json({ message: "Хэрэглэгч үүссэнгүй" }, { status: 500 })
    }

    // 2. Профайлын хүснэгтүүдийг үүсгэнэ. Аль нэг нь алдаа өгвөл auth хэрэглэгчийг
    // устгана — FK нь ON DELETE CASCADE тул үүссэн мөрүүд хамт устаж "хагас" бүртгэл үлдэхгүй.
    try {
      if (role === "staff") {
        const { error: staffError } = await supabase
          .from("mt_staff")
          .insert({ id: user.id, first_name: firstName, last_name: lastName, email })
        if (staffError) throw staffError

        const { error: profileError } = await supabase
          .from("mt_profile")
          .insert({ user_id: user.id, email, phone: "", bio: "", skills: "", experience: "", education: "" })
        if (profileError) throw profileError
      } else {
        const { error: companyError } = await supabase
          .from("mt_company")
          .insert({ id: user.id, company_name: companyName, email })
        if (companyError) throw companyError

        // Default (Free) багц
        const { error: subError } = await supabase
          .from("mt_company_subscriptions")
          .insert({
            user_id: user.id,
            plan_type: "free",
            status: "active",
            job_limit: PLANS.free.jobLimit,
            expires_at: null,
          })
        if (subError) throw subError
      }
    } catch (profileErr) {
      const { error: rollbackError } = await supabase.auth.admin.deleteUser(user.id)
      if (rollbackError) console.error("REGISTER_ROLLBACK_ERROR:", rollbackError)
      throw profileErr
    }

    // Баталгаажуулах кодыг дахин ашиглахгүйн тулд бүртгэл амжилттай болсны дараа устгана
    await supabase.from("register_auth").delete().eq("mail", email)

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
