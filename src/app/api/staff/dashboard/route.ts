import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Хэрэглэгчийн ID шаардлагатай" }, { status: 400 });
    }

    // 🌟 Долоо хоногийн эхлэлийг (Даваа гараг 00:00:00) тооцоолох
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Хэрэв Ням гараг бол -6, бусад үед Даваа гараг руу шилжүүлнэ
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0); // Цагийг 00:00:00 болгоно
    const startOfWeekISO = startOfWeek.toISOString();

    // 1. Хүснэгтүүдийг хооронд нь холбохгүйгээр хэрэгцээт датаг параллель татна
    // 🌟 mt_tips хүснэгтээс хамгийн сүүлийн 1 идэвхтэй зөвлөгөөг татах query-г нэмэв
    const [
      jobRequestsCountResponse, 
      jobRequestsThisWeekResponse, 
      profileResponse,
      recentApplicationsResponse,
      companyViewsCountResponse,
      cvViewsCountResponse,
      companiesResponse,
      tipResponse // 🌟 ШИНЭ
    ] = await Promise.all([
      supabase.from("tr_job_request").select("*", { count: "exact", head: true }).eq("applicant_id", userId),
      supabase.from("tr_job_request").select("*", { count: "exact", head: true }).eq("applicant_id", userId).gte("created_at", startOfWeekISO),
      supabase.from("mt_profile").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("tr_job_request").select("id, status, created_at, job_id").eq("applicant_id", userId).order("created_at", { ascending: false }),
      supabase.from("tr_company_views").select("*", { count: "exact", head: true }).eq("viewer_id", userId).gte("created_at", startOfWeekISO),
      supabase.from("tr_cv_views").select("*", { count: "exact", head: true }).eq("staff_id", userId),
      supabase.from("mt_company").select("id, company_name"),
      
      // 🌟 ШИНЭ ЛОГИК: Идэвхтэй зөвлөгөөнүүдээс хамгийн сүүлд үүсгэгдсэн 1-ийг татна
      supabase.from("mt_tips")
        .select("title, icon, content, detail_url")
        .eq("is_active", true)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    // Хэрэглэгчийн анкет илгээсэн ажлын байрнуудын ID-г массив болгож авна
    const appliedJobIds = (recentApplicationsResponse.data || [])
      .map((r: any) => r.job_id)
      .filter(Boolean);

    // 2. Илгээсэн ажлын ID-нуудаа хасаж, Санал болгох 100 ажлыг баазаас татна
    let openJobsQuery = supabase
      .from("mt_openjob")
      .select("id, title, category, job_type, location, salary, user_id, description")
      .eq("status", "active");

    if (appliedJobIds.length > 0) {
      openJobsQuery = openJobsQuery.not("id", "in", `(${appliedJobIds.join(",")})`);
    }

    const openJobsResponse = await openJobsQuery
      .order("created_at", { ascending: false })
      .limit(100);

    // Анкет илгээсэн ажлын байрнуудын мэдээллийг тусад нь татна
    let relatedJobs: any[] = [];
    if (appliedJobIds.length > 0) {
      const { data } = await supabase.from("mt_openjob").select("id, title, user_id, description").in("id", appliedJobIds);
      relatedJobs = data || [];
    }

    // Компаниудыг ID-аар нь хурдан хайх Map үүсгэнэ
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

    const thisWeekCount = jobRequestsThisWeekResponse.count || 0;

    // 🌟 Хэрэв баазаас зөвлөгөө олдоогүй бол харуулах fallback (default) дата
    const defaultTip = {
      title: "Амжилтын зөвлөгөө",
      icon: "💡",
      content: "Технологийн компаниуд анкет шалгахдаа хамгийн түрүүнд хийсэн төслүүд болон ашигласан технологиудын жагсаалтыг хардаг.",
      detail_url: "/staff/blog/tips"
    };

    // Фронтод очих эцсийн дата
    const finalData = {
      stats: {
        appliedCount: jobRequestsCountResponse.count || 0,
        appliedThisWeek: `+${thisWeekCount} энэ долоо хоногт`, 
        viewedCompaniesCount: companyViewsCountResponse.count || 0,
        cvViewRate: cvViewsCountResponse.count ? `${cvViewsCountResponse.count} удаа` : "0 удаа",
      },
      profileProgress: profileProgress,
      
      // 🌟 ШИНЭ: Хамгийн сүүлийн зөвлөгөөг дата руу нэмэв
      tip: tipResponse.data || defaultTip,

      // 1. Санал болгож буй ажлууд
      recommendedJobs: (openJobsResponse.data || []).map((job: any) => {
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
      recentApplications: (recentApplicationsResponse.data || []).map((app: any) => {
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