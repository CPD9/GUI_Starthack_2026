import { Suspense } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebarClient } from "@/modules/dashboard/ui/components/dashboard-sidebar-client";

const SIDEBAR_FALLBACK = <div className="hidden md:block w-72 border-r bg-sidebar" />;

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return ( 
    <SidebarProvider>
      <Suspense fallback={SIDEBAR_FALLBACK}>
        <DashboardSidebarClient />
      </Suspense>
      <main className="flex flex-col h-screen w-screen bg-background overflow-hidden relative">
        <div className="relative z-20">
          <DashboardNavbar />
        </div>
        <div className="flex-1 min-h-0 overflow-auto relative z-10">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};
 
export default Layout;
