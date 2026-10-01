import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ⚠️ Зөвхөн сервер талд (API route, Server Component) ашиглана.
// service_role key нь RLS-ийг тойрдог тул клиент компонентоос хэзээ ч импортлохгүй.
// Хүснэгтүүд RLS асаалттай, anon/authenticated эрхгүй тул бүх DB хандалт
// энэ клиентээр, session шалгасны дараа явна.
if (typeof window !== "undefined") {
  throw new Error("@/lib/supabase-г клиент талд импортлох боломжгүй")
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY орчны хувьсагч тохируулаагүй байна")
  }
  return key
}

let serviceClient: SupabaseClient | null = null

function getServiceClient(): SupabaseClient {
  serviceClient ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getServiceRoleKey(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  return serviceClient
}

// Сервер талд бүх хүсэлт хуваалцдаг клиент — auth session хадгалахгүй.
// Анх ашиглах үед үүсгэнэ: `next build` импортлох үед key шаардахгүй.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getServiceClient()
    const value = Reflect.get(client, prop)
    return typeof value === "function" ? value.bind(client) : value
  },
})

// Нэвтрэх үед (signInWithPassword) хүсэлт бүрт шинэ клиент үүсгэнэ.
// Ингэхгүй бол нэг хэрэглэгчийн session хуваалцсан клиент дээр үлдэнэ.
// Энэ клиентээр хүснэгт рүү хандахгүй — зөвхөн auth-д ашиглана.
export function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
