"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  NodeToolbar,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  BotIcon,
  DatabaseIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  Loader2Icon,
  MailIcon,
  MessageCircleIcon,
  PlayIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildReportPayload } from "@/modules/reports/utils/report-builder";
import type { AutomationRunResponse } from "@/modules/visualizations/types";
import type { DatasetRow, PipelineNodeResponse } from "@/modules/visualizations/types";

type NodeStatus = "idle" | "configured" | "running" | "success" | "error";

type WorkflowNodeData = {
  title: string;
  subtitle: string;
  icon: "http" | "query" | "ai" | "pdf" | "email" | "discord";
  status: NodeStatus;
};

const statusStyles: Record<NodeStatus, string> = {
  idle: "bg-muted text-muted-foreground",
  configured: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  running: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "bg-destructive/10 text-destructive",
};

const iconMap = {
  http: GlobeIcon,
  query: DatabaseIcon,
  ai: SparklesIcon,
  pdf: FileTextIcon,
  email: MailIcon,
  discord: MessageCircleIcon,
};

const WorkflowNodeCard = ({ id, data, selected }: NodeProps<Node<WorkflowNodeData>>) => {
  const Icon = iconMap[data.icon];
  const { deleteElements, setNodes } = useReactFlow();
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editSubtitle, setEditSubtitle] = useState(data.subtitle);

  const handleDelete = () => {
    if (window.confirm("Remove this node from the workflow?")) {
      deleteElements({ nodes: [{ id }] });
    }
  };

  const handleEditSave = () => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, title: editTitle, subtitle: editSubtitle } }
          : n
      )
    );
    setEditOpen(false);
  };

  return (
    <div className="w-[180px] min-w-0 max-w-[95vw] sm:w-[200px] rounded-xl border bg-card p-3 shadow-sm">
      <NodeToolbar isVisible={selected} className="flex items-center gap-1">
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (open) {
              setEditTitle(data.title);
              setEditSubtitle(data.subtitle);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Edit node">
              <SettingsIcon className="size-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit node</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Node title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-subtitle">Subtitle</Label>
                <Input
                  id="edit-subtitle"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="Node subtitle"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete} aria-label="Delete node">
          <TrashIcon className="size-3.5" />
        </Button>
      </NodeToolbar>
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div className="mb-3 flex items-center gap-2 min-w-0">
        <div className="rounded-md border p-1.5 shrink-0">
          <Icon className="size-4" />
        </div>
        <p className="font-medium text-sm truncate">{data.title}</p>
      </div>
      <p className="text-xs text-muted-foreground truncate">{data.subtitle}</p>
      <span className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] ${statusStyles[data.status]}`}>
        {data.status}
      </span>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
};

const initialNodes: Array<Node<WorkflowNodeData>> = [
  {
    id: "http",
    type: "workflowNode",
    position: { x: 40, y: 220 },
    data: {
      title: "HTTP Request",
      subtitle: "GET: https://api.com",
      icon: "http",
      status: "configured",
    },
  },
  {
    id: "query",
    type: "workflowNode",
    position: { x: 320, y: 330 },
    data: {
      title: "Query Materials",
      subtitle: "Attach CSV data",
      icon: "query",
      status: "idle",
    },
  },
  {
    id: "ai",
    type: "workflowNode",
    position: { x: 610, y: 220 },
    data: {
      title: "AI Model",
      subtitle: "OpenAI / Claude",
      icon: "ai",
      status: "idle",
    },
  },
  {
    id: "pdf",
    type: "workflowNode",
    position: { x: 900, y: 220 },
    data: {
      title: "PDF Report",
      subtitle: "Generate report",
      icon: "pdf",
      status: "idle",
    },
  },
  {
    id: "email",
    type: "workflowNode",
    position: { x: 1180, y: 220 },
    data: {
      title: "Email Notification",
      subtitle: "Send to signup email",
      icon: "email",
      status: "idle",
    },
  },
  {
    id: "discord",
    type: "workflowNode",
    position: { x: 1460, y: 220 },
    data: {
      title: "Discord",
      subtitle: "Post run status",
      icon: "discord",
      status: "idle",
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "http", target: "query", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2", source: "query", target: "ai", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3", source: "ai", target: "pdf", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e4", source: "pdf", target: "email", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e5", source: "email", target: "discord", markerEnd: { type: MarkerType.ArrowClosed } },
];

const nodeTemplates: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: WorkflowNodeData["icon"];
}> = [
  { id: "stat-summary", title: "Stat Summary", subtitle: "Batch KPIs", icon: "query" },
  { id: "correlation", title: "Correlation Heatmap", subtitle: "Numeric links", icon: "query" },
  { id: "pdf-report", title: "PDF Report", subtitle: "Shareable export", icon: "pdf" },
  { id: "email", title: "Email Notification", subtitle: "Stakeholder alert", icon: "email" },
];

export const WorkflowAgentsView = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("query");
  const [csvRows, setCsvRows] = useState<DatasetRow[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunningBoard, setIsRunningBoard] = useState(false);
  const [latestRun, setLatestRun] = useState<AutomationRunResponse | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [insightText, setInsightText] = useState("");
  const [requestUrl, setRequestUrl] = useState("https://api.com");
  const [llmProvider, setLlmProvider] = useState<"openai" | "claude">("openai");
  const [llmModel, setLlmModel] = useState("gpt-4o-mini");
  const [llmPrompt, setLlmPrompt] = useState(
    "Summarize the key material-testing findings and provide 3 actionable insights."
  );
  const [recipientEmail, setRecipientEmail] = useState("");
  const [nodeToAdd, setNodeToAdd] = useState(nodeTemplates[0].id);
  const [showAddNodeMenu, setShowAddNodeMenu] = useState(false);
  const [lastPipelineResult, setLastPipelineResult] = useState<PipelineNodeResponse | null>(null);
  const [message, setMessage] = useState("Attach CSV on Query Materials, then run workflow.");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNodeCard }), []);

  useEffect(() => {
    fetch("/api/workflow/recipient")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.ok && payload.email) setRecipientEmail(payload.email as string);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const setNodeStatus = useCallback(
    (id: string, status: NodeStatus, subtitle?: string) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  status,
                  subtitle: subtitle ?? node.data.subtitle,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((prev) =>
        addEdge(
          {
            ...connection,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          prev
        )
      ),
    [setEdges]
  );

  const addNodeFromTemplate = (templateId?: string) => {
    const template = nodeTemplates.find((item) => item.id === (templateId ?? nodeToAdd));
    if (!template) return;
    const nextNode: Node<WorkflowNodeData> = {
      id: `${template.id}-${Date.now()}`,
      type: "workflowNode",
      position: { x: 260 + Math.random() * 260, y: 430 + Math.random() * 120 },
      data: {
        title: template.title,
        subtitle: template.subtitle,
        icon: template.icon,
        status: "configured",
      },
    };
    setNodes((prev) => [...prev, nextNode]);
    setSelectedNodeId(nextNode.id);
    setShowAddNodeMenu(false);
  };

  const parseCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedRows = (result.data as DatasetRow[]).filter(
          (row) => Object.keys(row).length > 0
        );
        setCsvRows(parsedRows);
        setNodeStatus("query", "configured", `${parsedRows.length} rows attached`);
        setMessage(`CSV attached to board: ${parsedRows.length} rows.`);
      },
      error: (error) => {
        setNodeStatus("query", "error", "CSV parse failed");
        setMessage(`CSV parse failed: ${error.message}`);
      },
    });
  };

  const callPipeline = async (action: "clean" | "profile" | "model", rows: DatasetRow[]) => {
    const response = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        dataset: { rows, metadata: { source: "workflow-board" } },
        params: action === "model" ? { clusters: 3 } : {},
      }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? `Pipeline '${action}' failed.`);
    }
    return payload.result as PipelineNodeResponse;
  };

  const callLlm = async (context: string) => {
    const response = await fetch("/api/workflow/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: llmProvider,
        model: llmModel,
        prompt: llmPrompt,
        context,
      }),
    });
    const payload = (await response.json()) as { text?: string; error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "LLM step failed.");
    }
    return payload.text ?? "";
  };

  const handleRunWorkflowBoard = async () => {
    if (!csvRows.length) {
      setMessage("Attach CSV to Query Materials first.");
      setNodeStatus("query", "error", "No data attached");
      return;
    }

    setIsRunningBoard(true);
    setReportUrl(null);
    setMessage("Executing workflow board...");

    try {
      setNodeStatus("http", "running", `GET ${requestUrl}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNodeStatus("http", "success", `GET ${requestUrl}`);

      setNodeStatus("query", "running");
      const cleaned = await callPipeline("clean", csvRows);
      const profiled = await callPipeline("profile", cleaned.rows);
      setNodeStatus("query", "success", `${profiled.rows.length} rows profiled`);

      setNodeStatus("ai", "running", `${llmProvider}:${llmModel}`);
      const modeled = await callPipeline("model", profiled.rows);
      const modelType =
        typeof modeled.insights.model?.model_type === "string"
          ? modeled.insights.model.model_type
          : "analysis";
      const context = [
        `Rows processed: ${modeled.rows.length}`,
        `Model type: ${modelType}`,
        `Network nodes: ${modeled.visualizations.network?.nodes.length ?? 0}`,
        `Heatmap columns: ${modeled.visualizations.heatmap?.x.length ?? 0}`,
      ].join("\n");
      const llmInsight = await callLlm(context);
      setInsightText(llmInsight);
      setLastPipelineResult(modeled);
      setNodeStatus("ai", "success", `${llmProvider} complete`);

      setNodeStatus("pdf", "running");
      const reportPayload = buildReportPayload({
        title: "Workflow Board Demo Report",
        statusMessage: `Request: ${requestUrl} • Rows: ${csvRows.length} • ${llmProvider}/${llmModel}`,
        selectedVisualization: "workflow",
        result: modeled,
        chartNotes: [
          `Provider: ${llmProvider}`,
          `Model: ${llmModel}`,
        ],
      });
      const reportRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload),
      });
      if (!reportRes.ok) throw new Error("PDF generation failed.");
      const reportBlob = await reportRes.blob();
      const nextReportUrl = URL.createObjectURL(reportBlob);
      setReportUrl(nextReportUrl);
      setNodeStatus("pdf", "success", "Report generated");

      setNodeStatus("email", "running");
      const notifyRes = await fetch("/api/workflow/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recipientEmail || undefined,
          subject: "StartHack Workflow Demo - report ready",
          text:
            `Workflow completed.\n\n` +
            `Rows processed: ${modeled.rows.length}\n` +
            `Model: ${llmProvider}/${llmModel}\n` +
            `Insight:\n${llmInsight}\n`,
        }),
      });
      const notifyPayload = (await notifyRes.json()) as {
        ok?: boolean;
        deliveredTo?: string;
        mode?: string;
        error?: string;
      };
      if (!notifyRes.ok || notifyPayload.ok === false) {
        throw new Error(notifyPayload.error ?? "Email notification failed.");
      }
      setNodeStatus("email", "success", `Sent to ${notifyPayload.deliveredTo ?? recipientEmail}`);

      setNodeStatus("discord", "running");
      const automationRes = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "workflow-board-demo",
          trigger: "manual",
          payload: {
            source: "workflow-board",
            edges: edges.length,
            nodes: nodes.length,
            emailMode: notifyPayload.mode ?? "unknown",
          },
        }),
      });
      const automationPayload = (await automationRes.json()) as AutomationRunResponse & {
        error?: string;
      };
      if (!automationRes.ok) {
        throw new Error(automationPayload.error ?? "Automation trigger failed.");
      }
      setLatestRun(automationPayload);
      setNodeStatus("discord", "success", "Automation posted");

      setMessage("Workflow run complete: PDF generated, email node executed, automation queued.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workflow run failed.");
      setNodeStatus("pdf", "error", "Run failed");
      setNodeStatus("email", "error", "Run failed");
      setNodeStatus("discord", "error", "Run failed");
    } finally {
      setIsRunningBoard(false);
    }
  };

  const handleAddAutomation = async () => {
    setIsCreating(true);
    setMessage("Triggering automation run...");
    try {
      const response = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CSV analytics automation",
          trigger: "manual",
          payload: {
            source: "visualizations",
            requestedBy: "workflow-agents-view",
          },
        }),
      });
      const payload = (await response.json()) as AutomationRunResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Automation request failed.");
      }
      setLatestRun(payload);
      setMessage("Automation queued. Pipeline and report nodes can now execute.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Automation failed: ${error.message}`
          : "Automation failed unexpectedly."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workflow Demo</h1>
          <p className="text-muted-foreground">
            Attach data to nodes, run chain, generate PDF, notify by email.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleAddAutomation} disabled={isCreating}>
            {isCreating ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            Queue Automation
          </Button>
          <Button onClick={handleRunWorkflowBoard} disabled={isRunningBoard}>
            {isRunningBoard ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <PlayIcon className="size-4" />
            )}
            Run Workflow
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) parseCsv(file);
        }}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px]">
        <Card className="glass min-h-[400px] h-[50vh] sm:h-[55vh] lg:h-[560px] xl:h-[640px] overflow-hidden">
          <CardContent className="h-full p-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              fitView
              className="bg-muted/10"
            >
              <Background gap={22} size={1} />
              <MiniMap pannable zoomable />
              <Controls />
              <Panel position="top-right">
                <div className="flex flex-col items-end gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-background"
                    onClick={() => setShowAddNodeMenu((prev) => !prev)}
                    aria-label="Add node"
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                  {showAddNodeMenu ? (
                    <Card className="w-56 shadow-lg">
                      <CardContent className="space-y-2 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Add node</p>
                        {nodeTemplates.map((template) => (
                          <Button
                            key={template.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setNodeToAdd(template.id);
                              addNodeFromTemplate(template.id);
                            }}
                          >
                            {template.title}
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </Panel>
              <Panel position="top-left">
                <Button
                  size="sm"
                  variant="secondary"
                  className="shadow"
                  onClick={() => addNodeFromTemplate()}
                >
                  <PlusIcon className="size-4" />
                  Add Selected Node
                </Button>
              </Panel>
            </ReactFlow>
          </CardContent>
        </Card>

        <Card className="glass overflow-hidden">
          <CardContent className="space-y-4 pt-6 overflow-y-auto max-h-[60vh] lg:max-h-none">
            <div>
              <p className="text-sm font-medium">Selected node</p>
              <p className="text-xs text-muted-foreground">{selectedNodeId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">HTTP endpoint</p>
              <Input value={requestUrl} onChange={(e) => setRequestUrl(e.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Attach data</p>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="size-4" />
                Attach CSV to Query Materials
              </Button>
              <p className="text-xs text-muted-foreground">{csvRows.length} rows attached</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Add node (field list)</p>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  value={nodeToAdd}
                  onChange={(e) => setNodeToAdd(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {nodeTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => addNodeFromTemplate()}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">AI provider</p>
              <select
                value={llmProvider}
                onChange={(e) => {
                  const provider = e.target.value as "openai" | "claude";
                  setLlmProvider(provider);
                  setLlmModel(
                    provider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-latest"
                  );
                  setNodeStatus("ai", "configured", `${provider} selected`);
                }}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
              </select>
              <Input
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="Model"
              />
              <Textarea
                value={llmPrompt}
                onChange={(e) => setLlmPrompt(e.target.value)}
                className="min-h-[80px]"
              />
              <p className="text-[11px] text-muted-foreground">
                OpenAI is active. Claude needs `ANTHROPIC_API_KEY`.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Email target</p>
              <Input
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
              />
              <p className="text-[11px] text-muted-foreground">
                Defaults to signup email. SMTP missing means simulation mode.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">Workflow status</p>
              <p className="text-muted-foreground">{message}</p>
              {latestRun ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                  <BotIcon className="size-3.5" />
                  Run {latestRun.runId.slice(0, 8)}... - {latestRun.status}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">LLM insight preview</p>
              <Textarea
                value={insightText}
                onChange={(e) => setInsightText(e.target.value)}
                className="min-h-[120px]"
                placeholder="Workflow insights appear here."
              />
            </div>

            {lastPipelineResult ? (
              <div className="rounded-lg border bg-muted/20 p-3 text-xs">
                <p className="font-medium">Run output</p>
                <p>Rows: {lastPipelineResult.rows.length}</p>
                <p>Network nodes: {lastPipelineResult.visualizations.network?.nodes.length ?? 0}</p>
                <p>Heatmap size: {lastPipelineResult.visualizations.heatmap?.x.length ?? 0}</p>
              </div>
            ) : null}

            {reportUrl ? (
              <Button asChild variant="secondary" className="w-full">
                <a href={reportUrl} download="workflow-demo-report.pdf">
                  <DownloadIcon className="size-4" />
                  Download demo PDF
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
