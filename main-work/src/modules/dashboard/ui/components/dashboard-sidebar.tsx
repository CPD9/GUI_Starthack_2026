"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BotIcon, VideoIcon, BarChart3Icon, WorkflowIcon, SparklesIcon, PlusIcon, MessageSquareIcon, Loader2Icon, Trash2Icon, HistoryIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ThemedImage } from "@/components/themed-image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { DashboardUserButton } from "./dashboard-user-button";
import { DashboardTrial } from "./dashboard-trial";

const firstSection = [
  {
    icon: PlusIcon,
    label: "New Conversation",
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

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const currentChatId = searchParams.get("id");

  // Fetch chat history
  const { data: chatHistoryData, isLoading: isLoadingHistory } = useQuery(
    trpc.chat.getMany.queryOptions({ pageSize: 50 })
  );
  const chatHistoryList = chatHistoryData?.items ?? [];

  // Delete chat mutation
  const deleteChatMutation = useMutation(
    trpc.chat.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMany.queryKey() });
      },
    })
  );

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center justify-center py-4 px-4">
              <ThemedImage
                lightSrc="/logo-transparent.png"
                darkSrc="/logo-transparent-dark.png"
                alt="Zwick Roell Logo"
                width={140}
                height={40}
                className="object-contain"
              />
            </div>
            <Separator className="opacity-20 text-sidebar-foreground/50 mb-2" />
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-sidebar-accent/50 border border-transparent hover:border-sidebar-border",
                      (pathname === item.href || pathname.startsWith(item.href + "/")) && "bg-sidebar-accent border-sidebar-border"
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
        
        {/* Chat History, Upgrade & Free Trial - Combined Section */}
        <div className="px-4 py-1">
          <Separator className="opacity-20 text-sidebar-foreground/50" />
        </div>
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <SidebarMenuButton
                      className="h-10 hover:bg-sidebar-accent/50 border border-transparent hover:border-sidebar-border cursor-pointer"
                    >
                      <HistoryIcon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        Chat History
                      </span>
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <HistoryIcon className="size-5" />
                        Chat History
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : chatHistoryList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquareIcon className="size-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No chat history yet</p>
                          <p className="text-xs mt-1">Start a conversation to see it here</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {chatHistoryList.map((chat) => (
                            <div
                              key={chat.id}
                              className={cn(
                                "group flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent",
                                currentChatId === chat.id && "bg-accent border-primary"
                              )}
                            >
                              <Link
                                href={`/chat?id=${chat.id}`}
                                className="flex-1 min-w-0 flex items-center gap-3"
                              >
                                <MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {chat.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(chat.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteChatMutation.mutate({ id: chat.id });
                                }}
                              >
                                <Trash2Icon className="size-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "h-10 hover:bg-sidebar-accent/50 border border-transparent hover:border-sidebar-border",
                    (pathname === "/upgrade" || pathname.startsWith("/upgrade/")) && "bg-sidebar-accent border-sidebar-border"
                  )}
                  isActive={pathname === "/upgrade" || pathname.startsWith("/upgrade/")}
                >
                  <Link href="/upgrade">
                    <SparklesIcon className="size-5 text-red-500" />
                    <span className="text-sm font-medium tracking-tight">
                      Upgrade
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* Free Trial Usage */}
            <div className="mt-1 px-2">
              <DashboardTrial />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-sidebar-foreground">

        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  )
};