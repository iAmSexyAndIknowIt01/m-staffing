"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import JobDetailView from "@/components/staff/jobs/JobDetailView";
import ConfirmModal from "@/components/staff/jobs/ConfirmModal";
import SuccessModal from "@/components/staff/jobs/SuccessModal";
import ProfileIncompleteModal from "@/components/staff/common/ProfileIncompleteModal";
import AlertModal from "@/components/staff/jobs/AlertModal";
import LoadingLayout from "@/components/staff/common/LoadingLayout";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // URL-аас jobid эсвэл id-г найдвартай олж авах
  const rawId = params?.jobid || params?.id;
  const jobId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Modals & States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [profileIncompleteMessage, setProfileIncompleteMessage] = useState("");
  
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: "",
    title: "Мэдэгдэл"
  });

  // Slider & Drag States & Refs
  const [sliderX, setSliderX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const showAlert = (message: string, title: string = "Анхааруулга") => {
    setAlertModal({ show: true, message, title });
  };

  // Helper functions
  const formatSalary = (salaryStr: string | null | undefined) => {
    if (!salaryStr) return "Тохиролцоно";
    const numericSalary = parseInt(salaryStr.replace(/\D/g, ""), 10);
    if (isNaN(numericSalary)) return salaryStr;
    return `${numericSalary.toLocaleString()} ₮`;
  };

  const getCompanyLogoUrl = (logoUrl: string | null | undefined) => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith("http")) return logoUrl;
    const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co";
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/company-logos/${logoUrl}`;
  };

  const getJobTypeText = (type: string) => {
    switch (type) {
      case "fulltime": return "Бүтэн цаг";
      case "parttime": return "Хагас цаг";
      case "remote": return "Зайнаас (Remote)";
      default: return type;
    }
  };

  const getSalaryTypeText = (type: string) => {
    switch (type) {
      case "monthly": return "Сарын";
      case "hourly": return "Цагийн";
      case "yearly": return "Жилийн";
      case "negotiable": return "Тохиролцоно";
      default: return type || "";
    }
  };

  const handleCompanyClick = (e: React.MouseEvent, company: any) => {
    e.preventDefault();
    if (!company) return;
    const actualCompanyId = company.id || company.company_id;
    if (actualCompanyId) {
      router.push(`/dashboard/company/profile/${actualCompanyId}`);
    }
  };

  // Ажлын мэдээлэл татах
  useEffect(() => {
    async function fetchJob() {
      if (!jobId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/staff/jobs/${jobId}`);
        const data = await res.json();
        setJob(data.job || data);
      } catch (err) {
        console.error("Дата татахад алдаа гарлаа", err);
        showAlert("Дата татахад алдаа гарлаа", "Алдаа");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId]);

  // Scroll түгжих
  useEffect(() => {
    if (showConfirmModal || showSuccessModal || showProfileIncompleteModal || alertModal.show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showConfirmModal, showSuccessModal, showProfileIncompleteModal, alertModal.show]);

  // Профайл шалгах болон Confirm модал нээх
  const triggerApplyConfirmation = async (id: string) => {
    if (checkingProfile) return;
    setCheckingProfile(true);

    try {
      const response = await fetch("/api/staff/jobs/profileCheck");
      const result = await response.json();

      if (!response.ok || result.isComplete === false) {
        setProfileIncompleteMessage(result.error || "Профайл мэдээлэл дутуу байна. Та профайлаа бүрэн бөглөнө үү.");
        setShowProfileIncompleteModal(true);
        return;
      }

      setPendingJobId(id);
      setSliderX(0);
      setShowConfirmModal(true);
    } catch (err: any) {
      showAlert("Профайл шалгахад алдаа гарлаа. Дахин оролдоно үү.", "Алдаа");
    } finally {
      setCheckingProfile(false);
    }
  };

  // Анкет илгээх логик
  const handleApplyJob = async () => {
    if (!pendingJobId) return;
    
    setSubmitting(true);
    setShowConfirmModal(false);
    setSliderX(0);
    
    try {
      const applicationData = {
        job_id: pendingJobId,
        resume_url: ""
      };

      const response = await fetch("/api/jobRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Анкет илгээхэд алдаа гарлаа");

      fetch("/api/mail/job-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: pendingJobId }),
      }).catch((err) => console.error("Мэйл илгээх API-д алдаа гарлаа:", err));

      setAppliedJobIds((prev) => [...prev, pendingJobId]);
      if (job) {
        setJob({ ...job, is_applied: true });
      }
      setShowSuccessModal(true);
    } catch (err: any) {
      showAlert(err.message, "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
      setPendingJobId(null);
    }
  };

  // Slide to confirm Drag handlers
  const handleDragStart = (clientX: number) => {
    if (submitting) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !trackRef.current || !handleRef.current) return;

    const trackWidth = trackRef.current.clientWidth;
    const handleWidth = handleRef.current.clientWidth;
    const maxSlide = trackWidth - handleWidth - 8;

    let currentX = clientX - startXRef.current;
    if (currentX < 0) currentX = 0;
    if (currentX > maxSlide) currentX = maxSlide;

    setSliderX(currentX);

    if (currentX >= maxSlide - 2) {
      setIsDragging(false);
      handleApplyJob();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (trackRef.current && handleRef.current) {
      const trackWidth = trackRef.current.clientWidth;
      const handleWidth = handleRef.current.clientWidth;
      const maxSlide = trackWidth - handleWidth - 8;
      
      if (sliderX < maxSlide - 2) {
        setSliderX(0);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientX);
    };
    const handleEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, sliderX]);

  if (loading) {
    return <LoadingLayout loading={loading} />;
  }

  if (!job) return <div className="container mx-auto p-8 text-center">Ажлын байр олдсонгүй</div>;

  return (
    <div className="container mx-auto p-4 relative min-h-screen">
      {checkingProfile && (
        <div className="fixed top-0 left-0 right-0 h-1.5 bg-indigo-100 z-100 overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full w-1/2 animate-[bounce_1.5s_infinite] origin-left" style={{ animationDuration: '1s' }} />
        </div>
      )}

      <JobDetailView 
        job={job}
        appliedJobIds={appliedJobIds}
        submitting={submitting}
        checkingProfile={checkingProfile}
        getCompanyLogoUrl={getCompanyLogoUrl}
        getJobTypeText={getJobTypeText}
        getSalaryTypeText={getSalaryTypeText}
        formatSalary={formatSalary}
        handleCompanyClick={handleCompanyClick}
        triggerApplyConfirmation={triggerApplyConfirmation}
        onClose={() => router.back()} 
      />

      {/* Модалууд */}
      <ProfileIncompleteModal
        show={showProfileIncompleteModal}
        onClose={() => setShowProfileIncompleteModal(false)}
        message={profileIncompleteMessage}
      />

      <ConfirmModal
        show={showConfirmModal}
        submitting={submitting}
        sliderX={sliderX}
        isDragging={isDragging}
        trackRef={trackRef}
        handleRef={handleRef}
        onDragStart={handleDragStart}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingJobId(null);
          setSliderX(0);
        }}
      />

      <SuccessModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      <AlertModal
        alertModal={alertModal}
        onClose={() => setAlertModal((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
}