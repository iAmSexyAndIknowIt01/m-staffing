// catch блокт ирсэн unknown алдаанаас хэрэглэгчид харуулах мессеж гаргана
export function getErrorMessage(err: unknown, fallback = "Алдаа гарлаа. Дахин оролдоно уу."): string {
  return err instanceof Error && err.message ? err.message : fallback
}
