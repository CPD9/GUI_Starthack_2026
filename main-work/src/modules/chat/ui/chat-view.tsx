"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  SparklesIcon,
  MicIcon,
  PlusIcon,
  WrenchIcon,
  ImageIcon,
  PenLineIcon,
  ZapIcon,
  BookOpenIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";

interface Props {
  userName: string;
}

const SUGGESTION_BUBBLES = [
  { label: "Analyze test data", icon: ImageIcon, href: "/agents" },
  { label: "Compare batches", icon: PenLineIcon, href: "/agents" },
  { label: "Explain results", icon: BookOpenIcon, href: "/agents" },
  { label: "Quick insights", icon: ZapIcon, href: "/agents" },
  { label: "Talk to expert", icon: SparklesIcon, href: "/agents" },
];

export const ChatView = ({ userName }: Props) => {
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const trpc = useTRPC();
  const { data: agentsData } = useQuery(
    trpc.agents.getMany.queryOptions({ pageSize: 10 })
  );
  const agents = agentsData?.items ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-background to-muted/30">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-auto">
        {!showChat ? (
          <>
            <div className="flex flex-col items-center text-center max-w-2xl gap-4 mb-8">
              <div className="flex items-center gap-2 text-primary">
                <SparklesIcon className="size-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Hi {userName}. I&apos;m ready to help you explore your lab data.
              </h1>
              <p className="text-muted-foreground text-lg">
                Ask questions in natural language, get data-driven insights, and
                understand your materials testing results.
              </p>
            </div>

            <div className="w-full max-w-2xl mb-6">
              <div className="glass rounded-2xl shadow-lg border border-border/50 p-2 flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-xl"
                >
                  <PlusIcon className="size-5" />
                </Button>
                <Input
                  placeholder="Ask about your lab testing data..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputValue.trim()) {
                      setShowChat(true);
                    }
                  }}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-6"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <WrenchIcon className="size-4" />
                    <span className="hidden sm:inline ml-1">Tools</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <MicIcon className="size-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {SUGGESTION_BUBBLES.map((bubble) => {
                  const Icon = bubble.icon;
                  return (
                    <Button
                      key={bubble.label}
                      variant="outline"
                      asChild
                      className="glass-subtle rounded-full px-4 py-2 h-auto font-normal hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      <Link href={bubble.href}>
                        <Icon className="size-4 mr-2" />
                        {bubble.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>

              {agents.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Or talk to an expert agent:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {agents.slice(0, 5).map((agent) => (
                      <Button
                        key={agent.id}
                        variant="outline"
                        asChild
                        className="glass-subtle rounded-full px-4 py-2 h-auto font-normal hover:bg-primary/10 hover:border-primary/30 transition-colors"
                      >
                        <Link href={`/agents/${agent.id}`}>
                          <GeneratedAvatar
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="size-4 mr-2"
                          />
                          {agent.name}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            <div className="glass rounded-xl border border-border/50 p-4 flex-1 flex flex-col min-h-[400px]">
              <p className="text-muted-foreground text-center py-8">
                Chat with data assistant coming soon. For now, start a session
                with an Analytics Agent to get AI-powered insights.
              </p>
              <Button asChild variant="outline" className="mt-auto">
                <Link href="/meetings">Start a Session</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          Your conversations may be reviewed to improve our analytics.{" "}
          <Link href="#" className="underline underline-offset-2">
            Manage activity
          </Link>
        </p>
      </div>
    </div>
  );
};
