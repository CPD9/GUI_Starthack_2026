"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export const WorkflowAgentsView = () => {
  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workflow Agents</h1>
          <p className="text-muted-foreground">
            Autonomous agents that run automated workflows on your lab data
          </p>
        </div>
        <Button>
          <PlusIcon className="size-4" />
          Create Workflow Agent
        </Button>
      </div>

      <Card className="glass flex-1">
        <CardContent className="pt-6">
          <EmptyState
            image="/upcoming.svg"
            title="Workflow agents coming soon"
            description="Create autonomous agents that automatically analyze batches, generate reports, and trigger actions based on your lab data."
          />
        </CardContent>
      </Card>
    </div>
  );
};
