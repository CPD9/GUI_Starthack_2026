"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BotIcon, StarIcon, VideoIcon, MessageSquareIcon, BarChart3Icon, WorkflowIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { DashboardTrial } from "./dashboard-trial";
import { DashboardUserButton } from "./dashboard-user-button";

const firstSection = [
  {
    icon: MessageSquareIcon,
    label: "Chat",
    href: "/chat",
  },
  {
    icon: VideoIcon,
    label: "Sessions",
    href: "/meetings",
  },
  {
    icon: BotIcon,
    label: "Analytics Agents",
    href: "/agents",
  },
  {
    icon: BarChart3Icon,
    label: "Visualizations",
    href: "/visualizations",
  },
  {
    icon: WorkflowIcon,
    label: "Workflow Agents",
    href: "/workflow-agents",
  },
];

const secondSection = [
  {
    icon: StarIcon,
    label: "Upgrade",
    href: "/upgrade",
  },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2">
          <Image src="/logo.svg" height={36} width={36} alt="Zwick/Roell Analytics" />
          <p className="text-2xl font-semibold">Zwick/Roell</p>
        </Link>
      </SidebarHeader>
      <div className="px-4 py-2">
        <Separator className="opacity-20 text-sidebar-foreground/50" />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-sidebar-accent/50 border border-transparent hover:border-white/10",
                      (pathname === item.href || pathname.startsWith(item.href + "/")) && "bg-sidebar-accent border-white/10"
                    )}
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="px-4 py-2">
          <Separator className="opacity-20 text-sidebar-foreground/50" />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-sidebar-accent/50 border border-transparent hover:border-white/10",
                      (pathname === item.href || pathname.startsWith(item.href + "/")) && "bg-sidebar-accent border-white/10"
                    )}
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-white">
        <DashboardTrial />
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  )
};