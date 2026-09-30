import { createClient } from "@supabase/supabase-js"

// Сервер талд бүх хүсэлт хуваалцдаг клиент — auth session хадгалахгүй
export const supabase =
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

// Нэвтрэх/бүртгүүлэх үед хүсэлт бүрт шинэ клиент үүсгэнэ.
// Ингэхгүй бол нэг хэрэглэгчийн session хуваалцсан клиент дээр үлдэж,
// бусад хэрэглэгчийн query тэр хүний эрхээр явна.
export function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
