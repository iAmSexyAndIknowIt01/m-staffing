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
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-800 break-words">{children}</div>
      </div>
    </div>
  );
}

function TextSection({ title, text, empty }: { title: string; text?: string | null; empty: string }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
      <h2 className="text-base font-semibold text-slate-900 pb-3 mb-4 border-b border-slate-100">{title}</h2>
      {text?.trim() ? (
        <p className="text-[15px] leading-7 text-slate-700 whitespace-pre-line">{text}</p>
      ) : (
        <p className="text-sm text-slate-400">{empty}</p>
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
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition ${
        isApplied
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
          : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm disabled:opacity-60 disabled:cursor-wait"
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
    <div className="w-full max-w-5xl mx-auto pb-28 lg:pb-12 pt-2 sm:px-2 space-y-6">
      <div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Буцах
        </button>
      </div>

      {/* ТОЛГОЙ ХЭСЭГ */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 bg-orange-500" />
        <div className="p-5 sm:p-8 flex flex-col md:flex-row md:items-start gap-5">
          <button
            type="button"
            onClick={(e) => handleCompanyClick(e, company)}
            disabled={!companyId}
            className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center justify-center hover:border-slate-300 transition disabled:cursor-default"
            title={companyId ? "Байгууллагын профайл үзэх" : undefined}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={`${companyName} лого`} className="w-full h-full object-contain rounded-xl" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">{job.title}</h1>
            {companyId ? (
              <button
                type="button"
                onClick={(e) => handleCompanyClick(e, company)}
                className="mt-1 text-sm sm:text-base font-medium text-slate-600 hover:text-orange-600 transition"
              >
                {companyName}
              </button>
            ) : (
              <p className="mt-1 text-sm sm:text-base font-medium text-slate-500">{companyName}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {job.job_type && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" /> {getJobTypeText(job.job_type)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> {job.location || "Байршил тодорхойгүй"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(job.created_at)}
              </span>
            </div>
          </div>

          {/* Цалин + үйлдэл (компьютер) */}
          <div className="hidden md:flex flex-col items-end gap-3 shrink-0 text-right">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Цалин</p>
              <p className="text-xl font-bold text-slate-900">{salaryText}</p>
              {salaryTypeText && <p className="text-xs text-slate-500">{salaryTypeText}</p>}
            </div>
            {applyButton()}
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
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 pb-1">Ажлын байрны мэдээлэл</h2>
            <InfoRow icon={<Wallet className="w-4 h-4" />} label="Цалин">
              {salaryText}
              {salaryTypeText && <span className="text-slate-500 font-normal"> · {salaryTypeText}</span>}
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

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
            <h2 className="text-base font-semibold text-slate-900 pb-4">Байгууллага</h2>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <Building2 className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 break-words">{companyName}</p>
            </div>
            {(company?.industry || company?.company_size) && (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {company?.industry && (
                  <p className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" /> {company.industry}
                  </p>
                )}
                {company?.company_size && (
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" /> {company.company_size}
                  </p>
                )}
              </div>
            )}
            {companyId && (
              <button
                type="button"
                onClick={(e) => handleCompanyClick(e, company)}
                className="mt-5 w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Байгууллагын профайл үзэх <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </section>
        </aside>
      </div>

      {/* Утсан дээр доод талд тогтмол үйлдлийн мөр */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Цалин</p>
          <p className="text-sm font-bold text-slate-900 truncate">{salaryText}</p>
        </div>
        {applyButton("shrink-0")}
      </div>
    </div>
  );
}
