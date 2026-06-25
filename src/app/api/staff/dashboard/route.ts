import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Хэрэглэгчийн ID шаардлагатай" }, { status: 400 });
    }

    // 1. Хүснэгтүүдийг хооронд нь холбохгүйгээр тус тусад нь датаг параллель татна
    const [
      jobRequestsCountResponse, 
      profileResponse,
      openJobsResponse,
      recentApplicationsResponse,
      companyViewsCountResponse,
      cvViewsCountResponse,
      companiesResponse
    ] = await Promise.all([
      supabase.from("tr_job_request").select("*", { count: "exact", head: true }).eq("applicant_id", userId),
      supabase.from("mt_profile").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("mt_openjob").select("id, title, category, job_type, location, salary, user_id").eq("status", "active").order("created_at", { ascending: false }).limit(100),
      // ⚠️ Хэрэв бааз дээр чинь 'job_id' биш бол доорх нэрийг солиорой (жишээ нь: openjob_id)
      supabase.from("tr_job_request").select("id, status, created_at, job_id").eq("applicant_id", userId).order("created_at", { ascending: false }),
      supabase.from("tr_company_views").select("*", { count: "exact", head: true }).eq("viewer_id", userId),
      supabase.from("tr_cv_views").select("*", { count: "exact", head: true }).eq("staff_id", userId),
      supabase.from("mt_company").select("id, company_name")
    ]);

    // Анкет илгээсэн ажлын байрнуудын мэдээллийг цуглуулж авах
    // ⚠️ Баазын талбарын нэр чинь 'job_id' биш бол 'r.job_id'-ийг бас солино
    const requestedJobIds = (recentApplicationsResponse.data || []).map((r: any) => r.job_id).filter(Boolean);
    let relatedJobs: any[] = [];
    if (requestedJobIds.length > 0) {
      const { data } = await supabase.from("mt_openjob").select("id, title, user_id").in("id", requestedJobIds);
      relatedJobs = data || [];
    }

    // Компаниудыг ID-аар нь хурдан хайх Map үүсгэнэ
    // Энд String болон UUID-ийн төрлийн зөрүүг арилгахын тулд `.toString()` ашиглав
    const companyMap = (companiesResponse.data || []).reduce((acc: any, curr: any) => {
      if (curr.id) acc[curr.id.toString()] = curr.company_name;
      return acc;
    }, {});

    // Ажлын байруудыг ID-аар нь хурдан хайх Map үүсгэнэ
    const jobMap = relatedJobs.reduce((acc: any, curr: any) => {
      if (curr.id) acc[curr.id.toString()] = curr;
      return acc;
    }, {});

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

    // Фронтод очих эцсийн дата
    const finalData = {
      stats: {
        appliedCount: jobRequestsCountResponse.count || 0,
        appliedThisWeek: "+0 энэ долоо хоногт", 
        viewedCompaniesCount: companyViewsCountResponse.count || 0,
        cvViewRate: cvViewsCountResponse.count ? `${cvViewsCountResponse.count} удаа` : "0 удаа",
      },
      profileProgress: profileProgress,
      
      // 1. Санал болгож буй ажлууд дээр компанийн нэрийг тааруулж зооно
      recommendedJobs: (openJobsResponse.data || []).map((job: any) => {
        const companyIdStr = job.user_id ? job.user_id.toString() : "";
        return {
          id: job.id,
          title: job.title,
          company: companyMap[companyIdStr] || "Ажил олгогч", 
          type: job.job_type === "fulltime" ? "Бүтэн цаг" : job.job_type, 
          location: job.location || "Улаанбаатар",
          salary: job.salary ? `${job.salary} ₮` : "Тохиролцоно",
          category: job.category
        };
      }),

      // 2. Илгээсэн анкет дээр ажлын нэр болон компанийн нэрийг тааруулж зооно
      recentApplications: (recentApplicationsResponse.data || []).map((app: any) => {
        // ⚠️ Хэрэв талбарын нэр чинь 'job_id' биш бол 'app.job_id'-ийг солиорой
        const jobIdStr = app.job_id ? app.job_id.toString() : "";
        const correspondingJob = jobMap[jobIdStr];
        
        const companyIdStr = correspondingJob?.user_id ? correspondingJob.user_id.toString() : "";
        const compName = companyMap[companyIdStr];

        return {
          id: app.id,
          title: correspondingJob?.title || "Устгагдсан ажлын байр",
          company: compName || "Ажил олгогч",
          date: formatDate(app.created_at),
          status: app.status || "pending",
          statusColor: "bg-amber-50 text-amber-600 border-amber-100"
        };
      })
    };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}