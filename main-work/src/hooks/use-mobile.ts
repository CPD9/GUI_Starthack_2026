import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function getServerSnapshot() {
  return false
}

function getClientSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(MEDIA_QUERY).matches
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia(MEDIA_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
