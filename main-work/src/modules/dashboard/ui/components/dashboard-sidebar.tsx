"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VideoIcon, BarChart3Icon, WorkflowIcon, SparklesIcon, PlusIcon, MessageSquareIcon, Loader2Icon, Trash2Icon, HistoryIcon, PanelLeftCloseIcon, PanelLeftIcon, SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { DashboardCommand } from "./dashboard-command";

import { DashboardUserButton } from "./dashboard-user-button";
import { DashboardTrial } from "./dashboard-trial";

const topSection = [
  {
    icon: PlusIcon,
    label: "New Conversation",
    href: "/chat",
  },
];

const bottomSection = [
  {
    icon: VideoIcon,
    label: "Sessions",
    href: "/meetings",
  },
  {
    icon: SparklesIcon,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { state, toggleSidebar, isMobile } = useSidebar();
  const [commandOpen, setCommandOpen] = useState(false);
  
  const currentChatId = searchParams.get("id");
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch chat history
  const { data: chatHistoryData, isLoading: isLoadingHistory, isError: isChatHistoryError, refetch: refetchChatHistory } = useQuery(
    trpc.chat.getMany.queryOptions({ pageSize: 50 })
  );
  const chatHistoryList = chatHistoryData?.items ?? [];

  // Delete chat mutation
  const deleteChatMutation = useMutation(
    trpc.chat.remove.mutationOptions({
      onSuccess: (_data, variables) => {
        if (variables.id === currentChatId) {
          router.replace("/chat");
        }
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMany.queryKey() });
      },
    })
  );

  return (
    <>
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                isMobile
                  ? "Toggle sidebar"
                  : isCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              className="size-8 hover:bg-sidebar-accent/50"
              onClick={toggleSidebar}
            >
              {(isCollapsed || isMobile)
                ? <PanelLeftIcon className="size-4" />
                : <PanelLeftCloseIcon className="size-4" />
              }
            </Button>
            <div className="flex-1" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* New Conversation */}
                {topSection.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
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

                {/* Search */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Search (⌘K)"
                    className="h-10 hover:bg-sidebar-accent/50 border border-transparent hover:border-sidebar-border"
                    onClick={() => setCommandOpen(true)}
                  >
                    <SearchIcon className="size-5" />
                    <span className="text-sm font-medium tracking-tight">
                      Search
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Sessions and other items */}
                {bottomSection.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
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
        <div className="px-4 py-0">
          <Separator className="opacity-20 text-sidebar-foreground/50" />
        </div>
        <SidebarGroup className="py-0 -mt-4 ">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Chat History"
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
                      ) : isChatHistoryError ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-destructive">Failed to load chat history</p>
                          <Button variant="ghost" size="sm" onClick={() => refetchChatHistory()} className="mt-2">
                            Try again
                          </Button>
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
                                className="size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0 disabled:opacity-50"
                                disabled={deleteChatMutation.isPending}
                                aria-label={`Delete chat ${chat.title}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (window.confirm("Delete this conversation?")) {
                                    deleteChatMutation.mutate({ id: chat.id });
                                  }
                                }}
                              >
                                {deleteChatMutation.isPending ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                  <Trash2Icon className="size-4 text-destructive" />
                                )}
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
                  tooltip="Upgrade"
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
            <div className={cn("mt-1", isCollapsed ? "px-0" : "px-2")}>
              <DashboardTrial />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-sidebar-foreground">
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
    </>
  )
};