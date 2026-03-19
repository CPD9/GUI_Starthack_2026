import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { ChatView } from "@/modules/chat/ui/chat-view";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return <ChatView userName={session.user.name ?? "Engineer"} />;
};

export default Page;
