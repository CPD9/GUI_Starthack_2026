"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";

/**
 * Wraps DashboardSidebar and defers rendering until after mount.
 * Fixes hydration mismatch caused by useIsMobile, useSearchParams,
 * and locale-dependent date formatting in the sidebar tree.
 */
const SIDEBAR_FALLBACK = (
  <div className="hidden md:block w-72 border-r bg-sidebar" aria-hidden="true" />
);

export function DashboardSidebarClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return SIDEBAR_FALLBACK;
  }

  return <DashboardSidebar />;
}
