import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { selectInChunks } from "@/lib/chunk";

export const revalidate = 0;

export async function GET() {
  try {
    // Хэрэглэгчийг URL-ээс биш, гарын үсэгтэй session-оос таньна
    const session = await getSession();
    const userId = session?.userId;

    if (!userId || session.role !== "staff") {
      return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
    }

    // Долоо хоногийн эхлэлийг (Даваа гараг 00:00:00) тооцоолох
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekISO = startOfWeek.toISOString();

    // 1. Параллель өгөгдөл татах (Зөвлөгөө татах логикийг салгаж, 2 тусдаа query болгов)
    const [
      jobRequestsCountResponse, 
      jobRequestsThisWeekResponse, 
      profileResponse,
      recentApplicationsResponse,
      companyViewsCountResponse,
      cvViewsCountResponse,
      blogTipsResponse,         // 🌟 tips-д зориулсан query
      interviewPrepResponse     // 🌟 interview-prep-д зориулсан query
    ] = await Promise.all([
      supabase.from("tr_job_request").select("*", { count: "exact", head: true }).eq("applicant_id", userId),
      supabase.from("tr_job_request").select("*", { count: "exact", head: true }).eq("applicant_id", userId).gte("created_at", startOfWeekISO),
      supabase.from("mt_profile").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("tr_job_request").select("id, status, created_at, job_id").eq("applicant_id", userId).order("created_at", { ascending: false }),
      supabase.from("tr_company_views").select("*", { count: "exact", head: true }).eq("viewer_id", userId).gte("created_at", startOfWeekISO),
      supabase.from("tr_cv_views").select("*", { count: "exact", head: true }).eq("staff_id", userId),
      // 🌟 "dashboard/staff/blog/tips" хаягтай хамгийн сүүлийн 1 идэвхтэй зөвлөгөө
      supabase.from("mt_tips")
        .select("title, icon, content, detail_url")
        .eq("is_active", true)
        .eq("detail_url", "dashboard/staff/blog/tips")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 🌟 "dashboard/staff/blog/interview-prep" хаягтай хамгийн сүүлийн 1 идэвхтэй зөвлөгөө
      supabase.from("mt_tips")
        .select("title, icon, content, detail_url")
        .eq("is_active", true)
        .eq("detail_url", "dashboard/staff/blog/interview-prep")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Хэрэглэгчийн анкет илгээсэн ажлын байрнуудын ID-г массив болгож авна
    const appliedJobIds = (recentApplicationsResponse.data || [])
      .map((r) => r.job_id)
      .filter(Boolean);

    // 2. Илгээсэн ажлуудаа хасаж, Санал болгох 100 ажлыг татна.
    // ID-уудыг URL-д (not.in) оруулбал олон анкеттай үед URL хэт урт болдог тул
    // илгээсэн тоогоор нь илүү татаж, санах ойд шүүнэ.
    const appliedSet = new Set(appliedJobIds.map(String));
    const openJobsResponse = await supabase
      .from("mt_openjob")
      .select("id, title, category, job_type, location, salary, user_id, description")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(Math.min(100 + appliedSet.size, 1000));

    if (openJobsResponse.error) throw openJobsResponse.error;
    const recommendedJobs = (openJobsResponse.data || [])
      .filter((job) => !appliedSet.has(String(job.id)))
      .slice(0, 100);

    // Анкет илгээсэн ажлын байрнуудын мэдээллийг тусад нь татна
    const relatedJobs = await selectInChunks<{ id: string; title: string; user_id: string; description: string }>(
      appliedJobIds,
      (ids) => supabase.from("mt_openjob").select("id, title, user_id, description").in("id", ids)
    );

    // Бүх компанийг биш, зөвхөн харуулах ажлуудын компанийн нэрийг татна
    const companies = await selectInChunks<{ id: string; company_name: string }>(
      [...recommendedJobs, ...relatedJobs].map((job) => job.user_id).filter(Boolean),
      (ids) => supabase.from("mt_company").select("id, company_name").in("id", ids)
    );

    // Компаниудыг ID-аар нь хурдан хайх Map үүсгэнэ
    const companyMap = companies.reduce((acc, curr) => {
      if (curr.id) acc[curr.id.toString()] = curr.company_name;
      return acc;
    }, {} as Record<string, string>);

    // Ажлын байруудыг ID-аар нь хурдан хайх Map үүсгэнэ
    const jobMap = relatedJobs.reduce((acc, curr) => {
      if (curr.id) acc[curr.id.toString()] = curr;
      return acc;
    }, {} as Record<string, (typeof relatedJobs)[number]>);

    // Профайл хувь бодох логик
    const profile = profileResponse.data;
    let profileProgress = 0;
    if (profile) {
      const targetFields = ["email", "phone", "bio", "skills", "experience", "education", "availability", "photo_url"];
      let filledFieldsCount = 0;
      targetFields.forEach(field => {
        const val = profile[field];
        if (val !== null && val !== "" && (typeof val !== "object" || Object.keys(val).length > 0)) {
          filledFieldsCount++;
        }
      });
      profileProgress = Math.round((filledFieldsCount / targetFields.length) * 100);
    }

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("mn-MN"); 
    };

    const thisWeekCount = jobRequestsThisWeekResponse.count || 0;

    // 🌟 Хэрэв дата олдохгүй бол ашиглах default fallback зөвлөгөөнүүд
    const defaultBlogTip = {
      title: "Амжилтын зөвлөгөө",
      icon: "💡",
      content: "Технологийн компаниуд анкет шалгахдаа хамгийн түрүүнд хийсэн төслүүд болон ашигласан технологиудын жагсаалтыг хардаг.",
      detail_url: "dashboard/staff/blog/tips"
    };

    const defaultInterviewTip = {
      title: "Ярилцлагын бэлтгэл",
      icon: "🤝",
      content: "Ярилцлагад орохоос өмнө тухайн компанийн соёл, үнэ цэнэ болон бүтээгдэхүүний талаар урьдчилан судалсан байх нь давуу тал болно.",
      detail_url: "dashboard/staff/blog/interview-prep"
    };

    // Олдсон өгөгдлийг нэгтгэн массив үүсгэх
    const activeTips = [];
    if (blogTipsResponse.data) activeTips.push(blogTipsResponse.data);
    else activeTips.push(defaultBlogTip);

    if (interviewPrepResponse.data) activeTips.push(interviewPrepResponse.data);
    else activeTips.push(defaultInterviewTip);

    // Фронтод очих эцсийн дата
    const finalData = {
      stats: {
        appliedCount: jobRequestsCountResponse.count || 0,
        appliedThisWeek: `+${thisWeekCount} энэ долоо хоногт`, 
        viewedCompaniesCount: companyViewsCountResponse.count || 0,
        cvViewRate: cvViewsCountResponse.count ? `${cvViewsCountResponse.count} удаа` : "0 удаа",
      },
      profileProgress: profileProgress,
      
      // 🌟 Зөвлөгөөнүүдийг массив хэлбэрээр илгээнэ
      tips: activeTips,

      // 1. Санал болгож буй ажлууд
      recommendedJobs: recommendedJobs.map((job) => {
        const companyIdStr = job.user_id ? job.user_id.toString() : "";
        return {
          id: job.id,
          company_id: companyIdStr, 
          title: job.title,
          company: companyMap[companyIdStr] || "Ажил олгогч", 
          type: job.job_type === "fulltime" ? "Бүтэн цаг" : job.job_type, 
          location: job.location || "Улаанбаатар",
          salary: job.salary ? `${job.salary}` : "Тохиролцоно",
          category: job.category,
          description: job.description || "Ажлын тайлбар байхгүй байна."
        };
      }),

      // 2. Илгээсэн анкет
      recentApplications: (recentApplicationsResponse.data || []).map((app) => {
        const jobIdStr = app.job_id ? app.job_id.toString() : "";
        const correspondingJob = jobMap[jobIdStr];
        
        const companyIdStr = correspondingJob?.user_id ? correspondingJob.user_id.toString() : "";
        const compName = companyMap[companyIdStr];

        return {
          id: app.id,
          company_id: companyIdStr || null, 
          title: correspondingJob?.title || "Устгагдсан ажлын байр",
          company: compName || "Ажил олгогч",
          date: formatDate(app.created_at),
          status: app.status || "pending",
          statusColor: "bg-amber-50 text-amber-600 border-amber-100",
          description: correspondingJob?.description || "Ажлын тайлбар байхгүй байна."
        };
      })
    };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}