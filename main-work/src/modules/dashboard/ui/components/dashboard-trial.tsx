import { RocketIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Progress } from "@/components/ui/progress";

import {
  MAX_FREE_AGENTS,
  MAX_FREE_MEETINGS,
} from "@/modules/premium/constants";

export const DashboardTrial = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.premium.getFreeUsage.queryOptions());

  if (!data) return null;

  return (
    <div className="flex flex-col rounded-lg border bg-sidebar-accent/30 p-3">
      <div className="flex items-center gap-2 mb-3">
        <RocketIcon className="size-4 text-sidebar-foreground" />
        <p className="text-xs font-medium text-sidebar-foreground">Free Trial</p>
      </div>
      <div className="flex flex-col gap-y-3">
        <div className="flex flex-col gap-y-1">
          <p className="text-[10px] text-sidebar-foreground/70">
            {data.agentCount}/{MAX_FREE_AGENTS} Analytics Agents
          </p>
          <Progress value={Math.max(0, Math.min(100, (data.agentCount / MAX_FREE_AGENTS) * 100))} className="h-1.5" />
        </div>
        <div className="flex flex-col gap-y-1">
          <p className="text-[10px] text-sidebar-foreground/70">
            {data.meetingCount}/{MAX_FREE_MEETINGS} Sessions
          </p>
          <Progress value={Math.max(0, Math.min(100, (data.meetingCount / MAX_FREE_MEETINGS) * 100))} className="h-1.5" />
        </div>
      </div>
    </div>
  );
};
