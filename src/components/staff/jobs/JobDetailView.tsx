"use client";
import React, { useState } from "react";
import { ArrowLeft, MapPin, DollarSign, Briefcase, Calendar, Check, Copy } from "lucide-react";

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
  onClose 
}: any) {
  const isApplied = job.is_applied || (Array.isArray(appliedJobIds) && appliedJobIds.includes(job.id));
  const logoUrl = getCompanyLogoUrl(job.mt_company?.logo_url);

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-2 px-1 sm:px-6">
      {/* 1. Header */}
      <div className="flex items-center mb-4 px-2 sm:px-0">
        <button onClick={onClose} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold py-2">
          <ArrowLeft className="w-5 h-5" /> <span>Буцах</span>
        </button>
      </div>

      {/* 2. Main Card */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-start gap-4 sm:gap-5">
          <div onClick={(e) => handleCompanyClick(e, job.mt_company)} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" /> : <span className="font-bold text-indigo-500">{job.mt_company?.name?.substring(0, 2)}</span>}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mb-1">{job.title}</h1>
            <p className="text-sm font-medium text-indigo-600 cursor-pointer hover:underline" onClick={(e) => handleCompanyClick(e, job.mt_company)}>{job.mt_company?.name || "Компани нууцалсан"}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-slate-50/50">
          {[
            { icon: DollarSign, label: "Цалин", val: `₮ ${formatSalary(job.salary)}`, color: "text-emerald-600" },
            { icon: Briefcase, label: "Ажлын төрөл", val: getJobTypeText(job.job_type), color: "text-indigo-600" },
            { icon: Calendar, label: "Нийтэлсэн", val: new Date(job.created_at).toLocaleDateString("mn-MN"), color: "text-slate-600" }
          ].map((item, idx) => (
            <div key={idx} className={`p-4 sm:p-5 flex items-center gap-4 ${idx !== 2 ? 'border-b sm:border-b-0 sm:border-r border-slate-100' : ''}`}>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{item.label}</p>
                <p className="text-sm font-black text-slate-800">{item.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apply Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
          <button 
            onClick={() => triggerApplyConfirmation(job.id)}
            disabled={isApplied || submitting || checkingProfile}
            className={`w-full py-3.5 sm:py-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98] ${
              isApplied 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isApplied ? "Илгээгдсэн ✓" : "Анкет илгээх 🚀"}
          </button>
        </div>

        {/* Content Section */}
        <div className="p-5 sm:p-10 space-y-8 sm:space-y-10 border-t border-slate-100 bg-slate-50/30">
          <section>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 sm:h-6 bg-indigo-500 rounded-full"></span> Ажлын үүрэг
            </h3>
            <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed whitespace-pre-line pl-3 sm:pl-4">{job.description}</p>
          </section>
          
          <section>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 sm:h-6 bg-emerald-500 rounded-full"></span> Тавигдах шаардлага
            </h3>
            <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed whitespace-pre-line pl-3 sm:pl-4">{job.requirements}</p>
          </section>
        </div>
      </div>
    </div>
  );
}