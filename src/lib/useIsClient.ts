import { useSyncExternalStore } from "react"

const noopSubscribe = () => () => {}

// SSR үед false, браузерт true. createPortal-ыг document бэлэн болсны дараа л ажиллуулахад хэрэглэнэ.
// useEffect + setState-ээс ялгаатай нь нэмэлт render үүсгэхгүй.
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}
