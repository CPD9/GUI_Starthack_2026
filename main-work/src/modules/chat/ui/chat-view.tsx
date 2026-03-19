"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SparklesIcon,
  MicIcon,
  MicOffIcon,
  PlusIcon,
  WrenchIcon,
  ImageIcon,
  PenLineIcon,
  ZapIcon,
  BookOpenIcon,
  FileIcon,
  UploadIcon,
  LinkIcon,
  BarChart3Icon,
  DatabaseIcon,
  FileSpreadsheetIcon,
  SendIcon,
  Loader2Icon,
  UserIcon,
  BotIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BrainIcon,
  SearchIcon,
  LightbulbIcon,
  CheckCircle2Icon,

} from "lucide-react";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { SparkledBackground } from "@/components/sparkled";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";


interface Props {
  userName: string;
}

interface ReasoningStep {
  id: string;
  type: "understanding" | "analyzing" | "researching" | "formulating" | "complete";
  title: string;
  content: string;
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  reasoning?: ReasoningStep[];
}

const SUGGESTION_BUBBLES = [
  { label: "Analyze test data", icon: ImageIcon, href: "/agents" },
  { label: "Compare batches", icon: PenLineIcon, href: "/agents" },
  { label: "Explain results", icon: BookOpenIcon, href: "/agents" },
  { label: "Quick insights", icon: ZapIcon, href: "/agents" },
  { label: "Talk to expert", icon: SparklesIcon, href: "/agents" },
];

const TOOLS_OPTIONS = [
  { label: "Data Analysis", icon: BarChart3Icon, description: "Analyze test results and trends" },
  { label: "Database Query", icon: DatabaseIcon, description: "Query your testing database" },
  { label: "Report Generator", icon: FileSpreadsheetIcon, description: "Generate test reports" },
  { label: "Batch Comparison", icon: PenLineIcon, description: "Compare multiple test batches" },
];

const ATTACHMENT_OPTIONS = [
  { label: "Upload File", icon: UploadIcon, description: "Upload test data files" },
  { label: "Add Image", icon: ImageIcon, description: "Add images or charts" },
  { label: "Link Data", icon: LinkIcon, description: "Link to external data source" },
  { label: "Import CSV", icon: FileIcon, description: "Import CSV test data" },
];

export const ChatView = ({ userName }: Props) => {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVoiceMessage, setPendingVoiceMessage] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [currentReasoningStep, setCurrentReasoningStep] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullWelcomeText = `Hi ${userName}. I'm ready to help you explore your lab data.`;
  
  // Typewriter effect
  useEffect(() => {
    if (showChat) return; // Don't run when in chat mode
    
    setDisplayedText("");
    setIsTypingComplete(false);
    
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullWelcomeText.length) {
        setDisplayedText(fullWelcomeText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, 30); // Speed of typing (30ms per character)
    
    return () => clearInterval(typingInterval);
  }, [showChat, userName]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  // Handle new conversation from sidebar
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowChat(false);
      setMessages([]);
      setExpandedReasoning({});
      setCurrentChatId(null);
      router.replace("/chat", { scroll: false });
    }
  }, [searchParams, router]);
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const { data: agentsData } = useQuery(
    trpc.agents.getMany.queryOptions({ pageSize: 10 })
  );
  const agents = agentsData?.items ?? [];

  // Mutations for chat operations
  const createChatMutation = useMutation(
    trpc.chat.createWithMessages.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMany.queryKey() });
      },
    })
  );

  const addMessageMutation = useMutation(
    trpc.chat.addMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.chat.getMany.queryKey() });
      },
    })
  );

  // Load a specific chat by ID
  const loadChatById = useCallback(async (chatId: string) => {
    try {
      const chat = await queryClient.fetchQuery(
        trpc.chat.getOne.queryOptions({ id: chatId })
      );
      
      if (chat) {
        const loadedMessages: Message[] = chat.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));
        
        setMessages(loadedMessages);
        setCurrentChatId(chatId);
        setShowChat(true);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  }, [queryClient, trpc.chat.getOne]);

  // Handle loading chat by ID from URL
  useEffect(() => {
    const chatId = searchParams.get("id");
    if (chatId && chatId !== currentChatId) {
      loadChatById(chatId);
    }
  }, [searchParams, currentChatId, loadChatById]);

  // Save current chat to database
  const saveChat = async (newMessages: Message[]) => {
    if (newMessages.length === 0) return;

    const firstUserMessage = newMessages.find(m => m.role === "user");
    const title = firstUserMessage 
      ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "") 
      : "New Chat";

    if (!currentChatId) {
      const result = await createChatMutation.mutateAsync({
        title,
        messages: newMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
      setCurrentChatId(result.id);
    } else {
      const lastTwoMessages = newMessages.slice(-2);
      for (const msg of lastTwoMessages) {
        await addMessageMutation.mutateAsync({
          chatId: currentChatId,
          role: msg.role,
          content: msg.content,
        });
      }
    }
  };

  // Generate reasoning steps based on the query
  const generateReasoningSteps = (query: string): ReasoningStep[] => {
    const now = new Date();
    return [
      {
        id: "1",
        type: "understanding",
        title: "Understanding Your Request",
        content: `Parsing your query: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}" — Identifying key terms, intent, and context requirements.`,
        timestamp: new Date(now.getTime()),
      },
      {
        id: "2", 
        type: "analyzing",
        title: "Analyzing Context",
        content: `Examining available data sources, relevant testing parameters, and historical patterns that match your query scope.`,
        timestamp: new Date(now.getTime() + 200),
      },
      {
        id: "3",
        type: "researching",
        title: "Retrieving Information",
        content: `Querying lab testing database, cross-referencing batch records, and gathering relevant data points for comprehensive analysis.`,
        timestamp: new Date(now.getTime() + 400),
      },
      {
        id: "4",
        type: "formulating",
        title: "Formulating Response",
        content: `Synthesizing findings, organizing insights, and structuring a clear, actionable response tailored to your specific needs.`,
        timestamp: new Date(now.getTime() + 600),
      },
      {
        id: "5",
        type: "complete",
        title: "Response Ready",
        content: `Analysis complete. All relevant data has been processed and the response has been generated with confidence.`,
        timestamp: new Date(now.getTime() + 800),
      },
    ];
  };

  const getReasoningIcon = (type: ReasoningStep["type"]) => {
    switch (type) {
      case "understanding":
        return <BrainIcon className="size-3.5" />;
      case "analyzing":
        return <BarChart3Icon className="size-3.5" />;
      case "researching":
        return <SearchIcon className="size-3.5" />;
      case "formulating":
        return <LightbulbIcon className="size-3.5" />;
      case "complete":
        return <CheckCircle2Icon className="size-3.5" />;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    
    const queryText = inputValue;
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setShowChat(true);
    setIsLoading(true);
    
    const reasoningSteps = generateReasoningSteps(queryText);
    
    for (let i = 0; i < reasoningSteps.length; i++) {
      setCurrentReasoningStep(reasoningSteps[i].title);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `I understand you're asking about "${queryText}". I'm currently in demo mode, but I can help you analyze your lab testing data. For full functionality, please start a session with one of our Analytics Agents from the Agents page.`,
      timestamp: new Date(),
      reasoning: reasoningSteps,
    };
    
    const allMessages = [...newMessages, assistantMessage];
    setMessages(allMessages);
    setIsLoading(false);
    setCurrentReasoningStep(null);
    setExpandedReasoning((prev) => ({ ...prev, [assistantMessage.id]: false }));
    
    await saveChat(allMessages);
  };

  // Auto-send voice message after transcription
  useEffect(() => {
    if (pendingVoiceMessage) {
      const sendVoiceMessage = async () => {
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: pendingVoiceMessage,
          timestamp: new Date(),
        };
        
        const queryText = pendingVoiceMessage;
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue("");
        setShowChat(true);
        setIsLoading(true);
        setPendingVoiceMessage(null);
        
        const reasoningSteps = generateReasoningSteps(queryText);
        
        for (let i = 0; i < reasoningSteps.length; i++) {
          setCurrentReasoningStep(reasoningSteps[i].title);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I understand you're asking about "${queryText}". I'm currently in demo mode, but I can help you analyze your lab testing data. For full functionality, please start a session with one of our Analytics Agents from the Agents page.`,
          timestamp: new Date(),
          reasoning: reasoningSteps,
        };
        
        const allMessages = [...newMessages, assistantMessage];
        setMessages(allMessages);
        setIsLoading(false);
        setCurrentReasoningStep(null);
        setExpandedReasoning((prev) => ({ ...prev, [assistantMessage.id]: false }));
        
        await saveChat(allMessages);
      };
      
      sendVoiceMessage();
    }
  }, [pendingVoiceMessage]);

  // Transcribe audio using OpenAI Whisper
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const data = await response.json();
      if (data.text) {
        setPendingVoiceMessage(data.text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setInputValue("[Voice transcription failed. Please try again or type your message.]");
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  // Audio recorder hook
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
  } = useAudioRecorder({
    onRecordingComplete: transcribeAudio,
    onError: (error) => {
      console.error("Recording error:", error);
      setInputValue("[Microphone access denied. Please enable microphone permissions.]");
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleToolSelect = (toolLabel: string) => {
    setSelectedTools((prev) => 
      prev.includes(toolLabel) 
        ? prev.filter((t) => t !== toolLabel)
        : [...prev, toolLabel]
    );
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setInputValue(`[Attached: ${files[0].name}] `);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-background to-muted/30 relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv,.xlsx,.json,.txt"
      />
      
      <div className="flex-1 flex flex-col items-center justify-end px-4 py-8 pb-24 overflow-auto relative z-10">
        {!showChat ? (
          <>
            <div className="w-full max-w-2xl mb-6">
              {/* Sparkled background above the chat box */}
              <div className="flex justify-center mb-4">
                <SparkledBackground 
                  position="inline"
                  dotCount={1000}
                  reactRadius={60}
                  sphereRadius={35}
                  width={150}
                  height={150}
                  particleColor={resolvedTheme === "dark" ? "255, 255, 255" : "240, 159, 155"}
                  glowColor={resolvedTheme === "dark" ? "255, 255, 255" : "240, 159, 155"}
                  className="pointer-events-auto cursor-pointer"
                />
              </div>
              {selectedTools.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-2">
                  {selectedTools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                    >
                      <WrenchIcon className="size-3" />
                      {tool}
                      <button
                        onClick={() => handleToolSelect(tool)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="glass rounded-2xl shadow-lg border border-border/50 p-4 flex flex-col gap-3">
                <div className="flex items-end gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-xl"
                    >
                      <PlusIcon className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Add to chat</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ATTACHMENT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.label}
                          onClick={option.label === "Upload File" ? handleFileUpload : undefined}
                          className="flex items-start gap-3 py-2 cursor-pointer"
                        >
                          <Icon className="size-4 mt-0.5 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="flex-1 relative">
                  {/* Typewriter text displayed inside input area */}
                  {!inputValue && (
                    <div className="absolute inset-0 flex items-center pointer-events-none px-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        {displayedText}
                        {!isTypingComplete && <span className="animate-pulse">|</span>}
                      </span>
                    </div>
                  )}
                  <Input
                    placeholder=""
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputValue.trim()) {
                        handleSendMessage();
                      }
                    }}
                    className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-4"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`rounded-lg ${selectedTools.length > 0 ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        <WrenchIcon className="size-4" />
                        <span className="hidden sm:inline ml-1">
                          Tools{selectedTools.length > 0 ? ` (${selectedTools.length})` : ''}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Available Tools</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {TOOLS_OPTIONS.map((tool) => {
                        const Icon = tool.icon;
                        const isSelected = selectedTools.includes(tool.label);
                        return (
                          <DropdownMenuItem
                            key={tool.label}
                            onClick={() => handleToolSelect(tool.label)}
                            className={`flex items-start gap-3 py-2 cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                          >
                            <Icon className={`size-4 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{tool.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {tool.description}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="text-primary text-xs">Active</span>
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="ghost" 
                    size={(isRecording || isTranscribing) ? "default" : "icon"}
                    className={`rounded-xl transition-all duration-200 ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse gap-2 px-4' : isTranscribing ? 'bg-blue-500/10 text-blue-500 gap-2 px-4' : ''}`}
                    onClick={handleMicToggle}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        <span className="text-sm font-medium whitespace-nowrap">Transcribing</span>
                      </>
                    ) : isRecording ? (
                      <>
                        <MicOffIcon className="size-4" />
                        <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                      </>
                    ) : (
                      <MicIcon className="size-5" />
                    )}
                  </Button>
                  
                  {inputValue.trim() && (
                    <Button 
                      size="icon" 
                      className="rounded-xl"
                      onClick={handleSendMessage}
                    >
                      <SendIcon className="size-5" />
                    </Button>
                  )}
                </div>
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
            <div className="glass rounded-xl border border-border/50 p-4 flex-1 flex flex-col min-h-[400px] overflow-y-auto">
              <div className="flex flex-col gap-4 flex-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`shrink-0 size-8 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <UserIcon className="size-4" />
                      ) : (
                        <BotIcon className="size-4" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${message.role === "user" ? "" : "space-y-2"}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "glass border border-border/50"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-60 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      
                      {/* Reasoning Section */}
                      {message.role === "assistant" && message.reasoning && (
                        <Collapsible
                          open={expandedReasoning[message.id]}
                          onOpenChange={(open) => 
                            setExpandedReasoning((prev) => ({ ...prev, [message.id]: open }))
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50 group">
                              <BrainIcon className="size-3.5 text-purple-500" />
                              <span>View reasoning process</span>
                              {expandedReasoning[message.id] ? (
                                <ChevronDownIcon className="size-3.5 transition-transform" />
                              ) : (
                                <ChevronRightIcon className="size-3.5 transition-transform" />
                              )}
                              <span className="text-[10px] text-muted-foreground/70">
                                ({message.reasoning.length} steps)
                              </span>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                            <div className="mt-2 ml-1 border-l-2 border-purple-500/30 pl-3 space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {message.reasoning.map((step, index) => (
                                <div 
                                  key={step.id}
                                  className="relative"
                                >
                                  <div className="absolute -left-[17px] top-1 size-2 rounded-full bg-purple-500/60" />
                                  <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`flex items-center justify-center size-5 rounded-full ${
                                        step.type === "complete" 
                                          ? "bg-purple-500/20 text-purple-600" 
                                          : "bg-neutral-500/20 text-neutral-600 dark:text-neutral-400"
                                      }`}>
                                        {getReasoningIcon(step.type)}
                                      </span>
                                      <span className="text-xs font-medium text-foreground">
                                        {step.title}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground ml-auto">
                                        Step {index + 1}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {step.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="shrink-0 size-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                      <BotIcon className="size-4" />
                    </div>
                    <div className="glass border border-border/50 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Loader2Icon className="size-4 animate-spin text-purple-500" />
                        <span className="text-sm font-medium">Processing...</span>
                      </div>
                      {currentReasoningStep && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-purple-500/10 rounded-lg px-2 py-1.5">
                          <BrainIcon className="size-3.5 text-purple-500" />
                          <span>{currentReasoningStep}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="glass rounded-2xl shadow-lg border border-border/50 p-2 flex items-end gap-2 mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-xl"
                  >
                    <PlusIcon className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Add to chat</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ATTACHMENT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.label}
                        onClick={option.label === "Upload File" ? handleFileUpload : undefined}
                        className="flex items-start gap-3 py-2 cursor-pointer"
                      >
                        <Icon className="size-4 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Input
                placeholder="Continue the conversation..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    handleSendMessage();
                  }
                }}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base py-6"
              />
              <div className="flex items-center gap-1 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-lg ${selectedTools.length > 0 ? "bg-primary/10 text-primary" : ""}`}
                    >
                      <WrenchIcon className="size-4" />
                      <span className="hidden sm:inline ml-1">
                        Tools{selectedTools.length > 0 ? ` (${selectedTools.length})` : ""}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Available Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {TOOLS_OPTIONS.map((tool) => {
                      const Icon = tool.icon;
                      const isSelected = selectedTools.includes(tool.label);
                      return (
                        <DropdownMenuItem
                          key={tool.label}
                          onClick={() => handleToolSelect(tool.label)}
                          className={`flex items-start gap-3 py-2 cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
                        >
                          <Icon
                            className={`size-4 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{tool.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {tool.description}
                            </span>
                          </div>
                          {isSelected && <span className="text-primary text-xs">Active</span>}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size={(isRecording || isTranscribing) ? "default" : "icon"}
                  className={`rounded-xl transition-all duration-200 ${isRecording ? "bg-red-500/20 text-red-500 animate-pulse gap-2 px-4" : isTranscribing ? "bg-blue-500/10 text-blue-500 gap-2 px-4" : ""}`}
                  onClick={handleMicToggle}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      <span className="text-sm font-medium whitespace-nowrap">Transcribing</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <MicOffIcon className="size-4" />
                      <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                    </>
                  ) : (
                    <MicIcon className="size-5" />
                  )}
                </Button>

                <Button size="icon" className="rounded-xl" onClick={handleSendMessage} disabled={!inputValue.trim()}>
                  <SendIcon className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col items-center gap-2 relative z-10">
        {showChat && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowChat(false);
              setMessages([]);
              setExpandedReasoning({});
              setCurrentChatId(null);
              setInputValue("");
              router.replace("/chat", { scroll: false });
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <PlusIcon className="size-4" />
            <span className="text-xs">Collapse Chat</span>
          </Button>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Your conversations may be reviewed to improve our analytics.{" "}
          <Link href="#" className="underline underline-offset-2">
            Manage activity
          </Link>
        </p>
      </div>
    </div>
  );
};


