// Ажилтны профайл хэр бүрэн бөглөгдсөнийг тооцно.
// Профайл хуудас (хувь, дутуу хэсэг харуулах) болон компанийн «Ажилтан хайх» (зөвхөн 100%-ийг харуулах)
// хоёулаа энэ нэг дүрмийг хэрэглэнэ.

export interface StaffCompletenessInput {
  fullName: string
  phone: string
  bio: string
  avatarUrl: string
  gender: string
  skills: { technical?: string[]; languages?: string[] } | null | undefined
  experienceCount: number
  educationCount: number
  enabledDays: number
}

export function getStaffCompleteness(p: StaffCompletenessInput) {
  const skillCount = (p.skills?.technical?.length ?? 0) + (p.skills?.languages?.length ?? 0)
  const checks: [boolean, string][] = [
    [!!p.fullName.trim(), "нэр"],
    [!!p.phone.trim(), "утас"],
    [!!p.avatarUrl, "зураг"],
    [!!p.gender, "хүйс"],
    [!!p.bio.trim(), "танилцуулга"],
    [skillCount > 0, "ур чадвар"],
    [p.experienceCount > 0, "ажлын туршлага"],
    [p.educationCount > 0, "боловсрол"],
    [p.enabledDays > 0, "ажиллах цаг"],
  ]
  const done = checks.filter(([ok]) => ok).length
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([ok]) => !ok).map(([, label]) => label),
  }
}

export function isStaffProfileComplete(p: StaffCompletenessInput): boolean {
  return getStaffCompleteness(p).missing.length === 0
}
