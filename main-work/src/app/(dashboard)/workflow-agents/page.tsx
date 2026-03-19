import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { WorkflowAgentsView } from "@/modules/workflow-agents/ui/workflow-agents-view";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <WorkflowAgentsView />;
};

export default Page;
