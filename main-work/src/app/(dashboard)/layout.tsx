import { SidebarProvider } from "@/components/ui/sidebar";
import { SplineBackground } from "@/components/spline-background";

import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return ( 
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-col h-screen w-screen bg-muted overflow-hidden relative">
        <SplineBackground className="z-0" />
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
