import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Хэрэглэгчийн ID шаардлагатай" }, { status: 400 });
    }

    // Хурд болон гүйцэтгэлийг бодож query-үүдийг параллель ажиллуулна
    const [
      jobRequestsCountResponse, 
      profileResponse,
      openJobsResponse,
      recentApplicationsResponse
    ] = await Promise.all([
      // 1. Илгээсэн хүсэлтийн нийт тоог тоолох
      supabase
        .from("tr_job_request")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", userId),

      // 2. Профайлын мэдээлэл татах
      supabase
        .from("mt_profile")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),

      // 3. mt_openjob-оос хамгийн шинэ 100 ажлын байр татах
      supabase
        .from("mt_openjob")
        .select("id, title, category, job_type, location, salary")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100),

      // 4. Хэрэглэгчийн илгээсэн бүх анкетын төлөвийг татах
      supabase
        .from("tr_job_request")
        .select(`
          id,
          status,
          created_at,
          mt_openjob (
            title
          )
        `)
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false })
    ]);

    // Профайл бөглөлтийн хувь тооцоолох
    const profile = profileResponse.data;
    let profileProgress = 0;
    
    if (profile) {
      const targetFields = [
        "email", "phone", "bio", "skills", 
        "experience", "education", "availability", "photo_url"
      ];
      
      let filledFieldsCount = 0;
      targetFields.forEach(field => {
        const val = profile[field];
        if (val !== null && val !== "" && (typeof val !== "object" || Object.keys(val).length > 0)) {
          filledFieldsCount++;
        }
      });

      profileProgress = Math.round((filledFieldsCount / targetFields.length) * 100);
    }

    // Төлөвт тохируулан UI-ийн өнгө оноох функц
    const getStatusStyle = (status: string) => {
      switch (status?.toLowerCase()) {
        case "approved":
        case "ярилцлага":
          return "bg-emerald-50 text-emerald-600 border-emerald-100";
        case "rejected":
        case "татгалзсан":
          return "bg-rose-50 text-rose-600 border-rose-100";
        case "pending":
        case "хянагдаж буй":
        default:
          return "bg-amber-50 text-amber-600 border-amber-100";
      }
    };

    const getStatusText = (status: string) => {
      switch (status?.toLowerCase()) {
        case "approved": return "Ярилцлага";
        case "rejected": return "Татгалзсан";
        case "pending": return "Хянагдаж буй";
        default: return status || "Хянагдаж буй";
      }
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("mn-MN"); 
    };

    // Бэлэн болсон дата бүтэц
    const finalData = {
      stats: {
        appliedCount: jobRequestsCountResponse.count || 0,
        appliedThisWeek: "+0 энэ долоо хоногт", 
        viewedCompaniesCount: 0,
        cvViewRate: "100%",
      },
      profileProgress: profileProgress,
      recommendedJobs: (openJobsResponse.data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: "Ажил олгогч", 
        type: job.job_type === "fulltime" ? "Бүтэн цаг" : job.job_type, 
        location: job.location || "Улаанбаатар",
        salary: job.salary ? `${job.salary} ₮` : "Тохиролцоно",
        category: job.category
      })),
      recentApplications: (recentApplicationsResponse.data || []).map((app: any) => ({
        id: app.id,
        title: app.mt_openjob?.title || "Устгагдсан ажлын байр",
        company: "Ажил олгогч",
        date: formatDate(app.created_at),
        status: getStatusText(app.status),
        statusColor: getStatusStyle(app.status)
      }))
    };

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}