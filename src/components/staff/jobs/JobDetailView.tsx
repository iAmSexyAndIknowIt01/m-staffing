"use client";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Layers,
  Loader2,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import type { JobDetail, JobDetailHelpers } from "@/types/job";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <div className="mt-0.5 text-sm font-bold text-gray-800 break-words">{children}</div>
      </div>
    </div>
  );
}

function TextSection({ title, text, empty }: { title: string; text?: string | null; empty: string }) {
  return (
    <section className="bg-white border border-gray-100 rounded-4xl shadow-sm p-6 sm:p-8">
      <h2 className="text-lg font-black text-gray-900 pb-3 mb-4 border-b border-gray-50 flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full bg-indigo-500" /> {title}
      </h2>
      {text?.trim() ? (
        <p className="text-[15px] leading-7 text-gray-700 whitespace-pre-line">{text}</p>
      ) : (
        <p className="text-sm text-gray-400">{empty}</p>
      )}
    </section>
  );
}

// Ажил хайгчид харагдах ажлын байрны дэлгэрэнгүй — компанийн профайлтай ижил албан ёсны загвар
export default function JobDetailView({
  job,
  appliedJobIds = [],
  submitting,
  checkingProfile,
  getCompanyLogoUrl,
  getJobTypeText,
  getSalaryTypeText,
  formatSalary,
  handleCompanyClick,
  triggerApplyConfirmation,
  onClose,
}: JobDetailHelpers & { job: JobDetail; onClose: () => void }) {
  const isApplied = job.is_applied || (Array.isArray(appliedJobIds) && appliedJobIds.includes(job.id));
  const company = job.mt_company;
  const companyId = company?.id || company?.company_id;
  const logoUrl = getCompanyLogoUrl(company?.logo_url);
  const companyName = company?.name || "Байгууллагын нэр нууцалсан";

  // formatSalary нь өөрөө "₮" нэмдэг тул дахин нэмэхгүй
  const negotiable = !job.salary || job.salary_type === "negotiable";
  const salaryText = negotiable ? "Тохиролцоно" : formatSalary(job.salary);
  const salaryTypeText = !negotiable && job.salary_type ? getSalaryTypeText(job.salary_type) : null;

  const busy = submitting || checkingProfile;

  const applyButton = (extraClass = "") => (
    <button
      type="button"
      onClick={() => triggerApplyConfirmation(job.id)}
      disabled={isApplied || busy}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
        isApplied
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-wait"
      } ${extraClass}`}
    >
      {isApplied ? (
        <>
          <CheckCircle2 className="w-4 h-4" /> Анкет илгээгдсэн
        </>
      ) : busy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> {submitting ? "Илгээж байна..." : "Шалгаж байна..."}
        </>
      ) : (
        "Анкет илгээх"
      )}
    </button>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-28 lg:pb-12 pt-2 sm:px-2 space-y-6 animate-fade-in">
      <div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-100 hover:border-indigo-100 hover:text-indigo-600 rounded-2xl transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Буцах
        </button>
      </div>

      {/* ТОЛГОЙ ХЭСЭГ — staff хянах самбарын banner-тай ижил */}
      <section className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-4xl text-white shadow-xl shadow-indigo-950/10 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <button
            type="button"
            onClick={(e) => handleCompanyClick(e, company)}
            disabled={!companyId}
            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-sm hover:scale-105 transition-transform disabled:cursor-default disabled:hover:scale-100"
            title={companyId ? "Байгууллагын профайл үзэх" : undefined}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={`${companyName} лого`} className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Building2 className="w-8 h-8 text-indigo-300" strokeWidth={1.5} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {job.category && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-white/10 text-indigo-100 rounded-lg uppercase border border-white/10">{job.category}</span>
              )}
              {job.job_type && (
                <span className="px-2.5 py-0.5 text-[11px] font-medium bg-white/10 text-indigo-100 rounded-lg border border-white/10">{getJobTypeText(job.job_type)}</span>
              )}
              {isApplied && (
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-400/15 text-emerald-200 rounded-lg border border-emerald-300/20">Хүсэлт илгээсэн ✓</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight break-words">{job.title}</h1>
            <div className="mt-1.5 flex items-center gap-1.5">
              {companyId ? (
                <button
                  type="button"
                  onClick={(e) => handleCompanyClick(e, company)}
                  className="text-sm sm:text-base font-bold text-indigo-200 hover:text-white hover:underline transition"
                >
                  {companyName}
                </button>
              ) : (
                <p className="text-sm sm:text-base font-bold text-indigo-200/80">{companyName}</p>
              )}
              {company && <VerifiedBadge className="w-4 h-4" />}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-indigo-100/90 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-300" /> {job.location || "Байршил тодорхойгүй"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-300" /> {formatDate(job.created_at)}
              </span>
            </div>
          </div>

          {/* Цалин + үйлдэл (компьютер) */}
          <div className="hidden md:flex flex-col items-end gap-3 shrink-0 text-right">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80">Цалин</p>
              <p className="text-2xl font-black text-emerald-300">{salaryText}</p>
              {salaryTypeText && <p className="text-xs font-medium text-indigo-200/80">{salaryTypeText}</p>}
            </div>
            {applyButton(isApplied ? "" : "bg-white! text-indigo-700! hover:bg-indigo-50! shadow-indigo-950/30!")}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЗҮҮН: ҮҮРЭГ, ШААРДЛАГА */}
        <div className="lg:col-span-2 space-y-6">
          <TextSection title="Ажлын үүрэг" text={job.description} empty="Ажлын үүргийн тайлбар оруулаагүй байна." />
          <TextSection title="Тавигдах шаардлага" text={job.requirements} empty="Тавигдах шаардлага оруулаагүй байна." />
        </div>

        {/* БАРУУН: АЖЛЫН БАЙРНЫ МЭДЭЭЛЭЛ, БАЙГУУЛЛАГА */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <section className="bg-white border border-gray-100 rounded-4xl shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 pb-2">Ажлын байрны мэдээлэл</h2>
            <InfoRow icon={<Wallet className="w-4 h-4" />} label="Цалин">
              <span className="text-emerald-600">{salaryText}</span>
              {salaryTypeText && <span className="text-gray-400 font-medium"> · {salaryTypeText}</span>}
            </InfoRow>
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Ажлын төрөл">
              {job.job_type ? getJobTypeText(job.job_type) : "—"}
            </InfoRow>
            <InfoRow icon={<Layers className="w-4 h-4" />} label="Ангилал">
              {job.category || "—"}
            </InfoRow>
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Байршил">
              {job.location || "—"}
            </InfoRow>
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Нийтэлсэн огноо">
              {formatDate(job.created_at)}
            </InfoRow>
          </section>

          <section className="bg-white border border-gray-100 rounded-4xl shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 pb-4">Байгууллага</h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 bg-indigo-50 border border-indigo-100 rounded-2xl p-1 flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <Building2 className="w-5 h-5 text-indigo-400" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <p className={`text-sm font-bold break-words ${company ? "text-[#1877F2]" : "text-gray-900"}`}>{companyName}</p>
                {company && <VerifiedBadge className="w-3.5 h-3.5" />}
              </div>
            </div>
            {(company?.industry || company?.company_size) && (
              <div className="mt-4 space-y-2 text-sm font-medium text-gray-600">
                {company?.industry && (
                  <p className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" /> {company.industry}
                  </p>
                )}
                {company?.company_size && (
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" /> {company.company_size}
                  </p>
                )}
              </div>
            )}
            {companyId && (
              <button
                type="button"
                onClick={(e) => handleCompanyClick(e, company)}
                className="mt-5 w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition"
              >
                Байгууллагын профайл үзэх <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </section>
        </aside>
      </div>

      {/* Утсан дээр доод талд тогтмол үйлдлийн мөр */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Цалин</p>
          <p className="text-sm font-black text-emerald-600 truncate">{salaryText}</p>
        </div>
        {applyButton("shrink-0")}
      </div>
    </div>
  );
}

// Ажлын жагсаалтын (JobCard) байгууллагын нэрний хажууд гардаг цэнхэр баталгаажсан тэмдэг
function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-[#1877F2] rounded-full text-white shrink-0 ${className}`}
      aria-label="Баталгаажсан байгууллага"
      title="Баталгаажсан байгууллага"
    >
      <svg className="w-[70%] h-[70%] fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    </span>
  );
}
