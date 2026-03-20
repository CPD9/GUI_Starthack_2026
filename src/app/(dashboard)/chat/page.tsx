import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";

import { ChatView } from "@/modules/chat/ui/chat-view";

const ChatViewFallback = () => {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <p className="text-sm text-muted-foreground">Loading chat...</p>
    </div>
  );
};

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <Suspense fallback={<ChatViewFallback />}>
      <ChatView userName={session.user.name ?? "Engineer"} />
    </Suspense>
  );
};

export default Page;
