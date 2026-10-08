import { supabase } from "@/lib/supabase"

// auth_rate_limits хүснэгтэд суурилсан энгийн хязгаарлалт (имэйл код илгээх г.м.).
// Хүснэгт ажиллахгүй (migration ажиллаагүй) үед үйлдлийг хаахгүй — нэг л удаа анхааруулна.

export type RateAction = "mail_code"

// Нэг IP-ээс цагт илгээх имэйл кодын дээд тоо (бүртгэл + нууц үг сэргээх нийлээд)
export const MAIL_CODE_MAX_PER_IP = 10
export const MAIL_CODE_WINDOW_MS = 60 * 60 * 1000

let tableErrorLogged = false

function logOnce(error: unknown) {
  if (tableErrorLogged) return
  tableErrorLogged = true
  console.error("RATE_LIMIT_TABLE_ERROR (auth_rate_limits migration ажилласан эсэхийг шалгана уу):", error)
}

// Цонх доторх үйлдлийн тоо max-д хүрсэн эсэх
export async function isRateLimited(action: RateAction, key: string | null, max: number, windowMs: number): Promise<boolean> {
  if (!key) return false

  const { count, error } = await supabase
    .from("auth_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .eq("key", key)
    .gte("created_at", new Date(Date.now() - windowMs).toISOString())

  if (error) {
    logOnce(error)
    return false
  }
  return (count ?? 0) >= max
}

export async function recordRateEvent(action: RateAction, key: string | null) {
  if (!key) return
  const { error } = await supabase.from("auth_rate_limits").insert({ action, key })
  if (error) logOnce(error)

  // Хүснэгт хязгааргүй томрохгүйн тулд хааяа 1 хоногоос хуучин бичлэгүүдийг цэвэрлэнэ
  if (Math.random() < 0.02) {
    const { error: purgeError } = await supabase.rpc("purge_old_login_attempts")
    if (purgeError) console.error("RATE_LIMIT_PURGE_ERROR:", purgeError)
  }
}
