export { PASSWORD_MIN_LENGTH, validateNewPassword } from "@/lib/password"

export const RESET_CODE_TTL_MS = 10 * 60 * 1000 // Код 10 минут хүчинтэй
export const RESET_RESEND_COOLDOWN_MS = 60 * 1000 // Нэг имэйл рүү 60 секундэд нэг удаа
export const RESET_MAX_CODES_PER_HOUR = 5 // Нэг имэйл рүү цагт 5-аас олон код илгээхгүй
export const RESET_MAX_ATTEMPTS = 5 // Нэг кодыг 5 удаа буруу оруулбал хүчингүй
