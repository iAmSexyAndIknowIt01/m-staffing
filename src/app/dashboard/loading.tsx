import LoadingLayout from "@/components/common/LoadingLayout"

// Сервер дээр өгөгдөл татдаг dashboard хуудас руу шилжих үед (жишээ нь Анкетууд)
// хуудас бэлэн болтол цэс дарсны дараа шууд loader харуулна
export default function DashboardLoading() {
  return <LoadingLayout loading />
}
