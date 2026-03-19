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
      <main className="flex flex-col h-screen w-screen bg-muted overflow-hidden">
        <DashboardNavbar />
        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};
 
export default Layout;
