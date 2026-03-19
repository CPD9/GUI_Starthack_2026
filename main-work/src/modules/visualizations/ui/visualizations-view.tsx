"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  BarChart3Icon,
  DownloadIcon,
  FlaskConicalIcon,
  Loader2Icon,
  NetworkIcon,
  SaveIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildReportPayload } from "@/modules/reports/utils/report-builder";

import type { DatasetRow, PipelineNodeResponse } from "../types";
import { HeatmapChart } from "./components/heatmap-chart";
import { NetworkGraph } from "./components/network-graph";
import { PieChart } from "./components/pie-chart";

type SavedVisualization = {
  id: string;
  name: string;
  selectedViz: string;
  createdAt: string;
  result: PipelineNodeResponse;
};

type VizType = "network" | "pie" | "heatmap";

const formatFieldLabel = (value: string) =>
  value
    .replace(/\[[0-9]+\]/g, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Truncate long labels (GUIDs, paths) for chart display; full text in tooltip. */
const truncateLabel = (label: string, maxLen = 24): string => {
  const s = String(label).trim();
  if (s.length <= maxLen) return s;
  // Prefer last meaningful segment (e.g. "Force_Value" from "....Force_Value.name")
  const parts = s.split(/[.-]/);
  const last = parts.filter(Boolean).pop();
  if (last && last.length <= maxLen) return last;
  return s.slice(0, maxLen - 2) + "…";
};

export const VisualizationsView = () => {
  const [selectedViz, setSelectedViz] = useState<VizType>("pie");
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "Loading starter visualization from existing CSV..."
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineNodeResponse | null>(null);
  const [rawPreview, setRawPreview] = useState("");
  const [saveName, setSaveName] = useState("");
  const [savedVisualizations, setSavedVisualizations] = useState<SavedVisualization[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>("");

  const pieData = useMemo(() => {
    const candidates = result?.visualizations.pie_candidates ?? {};
    const key = Object.keys(candidates)[0];
    if (!key) {
      return { labels: [], displayLabels: [], values: [], selectedColumn: null as string | null };
    }
    const entries = Object.entries(candidates[key]).slice(0, 10);
    const labels = entries.map(([label]) => String(label));
    return {
      selectedColumn: key,
      labels,
      displayLabels: labels.map((l) => truncateLabel(l)),
      values: entries.map(([, value]) => Number(value)),
    };
  }, [result]);

  const networkFallback = useMemo(() => {
    if (!pieData.labels.length) {
      return { nodes: [], edges: [] } as {
        nodes: Array<{ id: string; label: string; group: string; value: number }>;
        edges: Array<{ source: string; target: string; weight: number }>;
      };
    }
    const nodes = pieData.labels.map((label, index) => ({
      id: `pie:${label}`,
      label: pieData.displayLabels[index] ?? truncateLabel(label),
      group: pieData.selectedColumn ?? "distribution",
      value: pieData.values[index] ?? 1,
    }));
    const edges = nodes.slice(0, -1).map((node, index) => ({
      source: node.id,
      target: nodes[index + 1].id,
      weight: Math.max(1, Math.round((node.value + nodes[index + 1].value) / 2)),
    }));
    return { nodes, edges };
  }, [pieData]);

  const activeNetwork = useMemo(() => {
    const network = result?.visualizations.network;
    if (network?.nodes?.length && network?.edges?.length) {
      return network;
    }
    return networkFallback;
  }, [result, networkFallback]);

  const summaryStats = useMemo(
    () => ({
      rows: result?.rows.length ?? rows.length,
      columns: result?.insights.profile?.column_count ?? (rows[0] ? Object.keys(rows[0]).length : 0),
      pieCategories: pieData.labels.length,
      networkNodes: activeNetwork.nodes.length,
    }),
    [result, rows, pieData.labels.length, activeNetwork.nodes.length]
  );

  const loadSavedVisualizations = async () => {
    const response = await fetch("/api/visualizations/saved", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "Failed to load saved visualizations.");
    }
    setSavedVisualizations(payload.items as SavedVisualization[]);
  };

  const loadDemoVisualization = async () => {
    try {
      const response = await fetch("/api/pipeline/demo", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatusMessage(payload.error ?? "No starter CSV found. Upload a CSV to begin.");
        return;
      }
      const nextResult = payload.result as PipelineNodeResponse;
      setResult(nextResult);
      setRows(nextResult.rows as DatasetRow[]);
      setRawPreview(JSON.stringify(nextResult.rows.slice(0, 5), null, 2));
      setStatusMessage(
        `Starter visualization loaded from ${payload.sourceFile} (${payload.sampledRows} sampled rows).`
      );
    } catch {
      setStatusMessage("Starter preload unavailable. Upload a CSV to continue.");
    }
  };

  useEffect(() => {
    loadDemoVisualization();
    loadSavedVisualizations().catch(() => {
      // optional on first load
    });
  }, []);

  const runPipeline = async (action: "profile" | "clean" | "normalize" | "model") => {
    if (!rows.length) {
      setStatusMessage("Upload CSV before running the pipeline.");
      return;
    }

    setIsRunning(true);
    setStatusMessage(`Running '${action}' step...`);
    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          dataset: { rows, metadata: { source: "csv-upload" } },
          params:
            action === "normalize"
              ? { mode: "zscore" }
              : action === "model"
              ? { clusters: 3 }
              : {},
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Pipeline request failed.");
      }
      const nextResult = payload.result as PipelineNodeResponse;
      setResult(nextResult);
      setRows(nextResult.rows as DatasetRow[]);
      setRawPreview(JSON.stringify(nextResult.rows.slice(0, 5), null, 2));
      setStatusMessage(`Completed '${action}' with ${nextResult.rows.length} rows.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unexpected pipeline error.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCsvUpload = (file: File) => {
    setIsRunning(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    fetch("/api/pipeline/upload", {
      method: "POST",
      body: uploadData,
    })
      .then(async (uploadResponse) => {
        if (!uploadResponse.ok) {
          const payload = await uploadResponse.json().catch(() => ({}));
          throw new Error(payload.error ?? "Failed to store raw CSV.");
        }
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (parseResult) => {
            const parsedRows = (parseResult.data as DatasetRow[]).filter(
              (row) => Object.keys(row).length > 0
            );
            setRows(parsedRows);
            setRawPreview(JSON.stringify(parsedRows.slice(0, 5), null, 2));
            setStatusMessage(`Loaded ${parsedRows.length} rows from CSV. Run Profile for charts.`);
            setIsRunning(false);
          },
          error: (error) => {
            setStatusMessage(`CSV parsing failed: ${error.message}`);
            setIsRunning(false);
          },
        });
      })
      .catch((error) => {
        setStatusMessage(error instanceof Error ? `CSV upload failed: ${error.message}` : "CSV upload failed.");
        setIsRunning(false);
      });
  };

  const exportPdf = async () => {
    const payload = buildReportPayload({
      statusMessage,
      selectedVisualization: selectedViz,
      result,
      chartNotes: [`Pie categories: ${pieData.labels.length}`],
    });

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatusMessage("PDF export failed.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "analytics-report.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage("PDF exported successfully.");
  };

  const saveVisualization = async () => {
    if (!result) {
      setStatusMessage("Run or load a visualization before saving.");
      return;
    }
    const name = saveName.trim() || `Visualization ${new Date().toLocaleString()}`;
    const response = await fetch("/api/visualizations/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, selectedViz, result }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setStatusMessage(payload.error ?? "Failed to save visualization.");
      return;
    }
    setSaveName("");
    await loadSavedVisualizations();
    setStatusMessage(`Saved visualization "${name}".`);
  };

  const loadSavedVisualization = () => {
    const saved = savedVisualizations.find((item) => item.id === selectedSavedId);
    if (!saved) return;
    setResult(saved.result);
    setRows(saved.result.rows as DatasetRow[]);
    setSelectedViz(saved.selectedViz as VizType);
    setRawPreview(JSON.stringify(saved.result.rows.slice(0, 5), null, 2));
    setStatusMessage(`Loaded saved visualization "${saved.name}".`);
  };

  const deleteSavedVisualization = async () => {
    if (!selectedSavedId) return;
    const response = await fetch(`/api/visualizations/saved?id=${selectedSavedId}`, {
      method: "DELETE",
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setStatusMessage(payload.error ?? "Failed to delete visualization.");
      return;
    }
    setSelectedSavedId("");
    await loadSavedVisualizations();
    setStatusMessage("Saved visualization deleted.");
  };

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-5 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visualizations</h1>
          <p className="text-muted-foreground">
            Clear, reusable analytics views for materials-testing datasets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => runPipeline("profile")} disabled={isRunning}>
            <FlaskConicalIcon className="size-4" />
            Run Profile
          </Button>
          <Button onClick={exportPdf} disabled={isRunning || !result}>
            <DownloadIcon className="size-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Rows</p>
            <p className="text-xl font-semibold">{summaryStats.rows}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Columns</p>
            <p className="text-xl font-semibold">{summaryStats.columns}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Pie categories</p>
            <p className="text-xl font-semibold">{summaryStats.pieCategories}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Network nodes</p>
            <p className="text-xl font-semibold">{summaryStats.networkNodes}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Data + Save Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleCsvUpload(file);
              }}
            />
            <Button variant="outline" onClick={() => runPipeline("clean")} disabled={isRunning || !rows.length}>
              Clean
            </Button>
            <Button variant="outline" onClick={() => runPipeline("normalize")} disabled={isRunning || !rows.length}>
              Normalize
            </Button>
            <Button variant="outline" onClick={() => runPipeline("model")} disabled={isRunning || !rows.length}>
              Model
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              placeholder="Snapshot name"
            />
            <Button variant="outline" onClick={saveVisualization} disabled={!result}>
              <SaveIcon className="size-4" />
              Save
            </Button>
            <Button variant="outline" onClick={loadDemoVisualization}>
              <UploadIcon className="size-4" />
              Reload Starter
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedSavedId}
              onChange={(event) => setSelectedSavedId(event.target.value)}
            >
              <option value="">Select saved visualization</option>
              {savedVisualizations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {new Date(item.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={loadSavedVisualization} disabled={!selectedSavedId}>
              Load
            </Button>
            <Button variant="outline" onClick={deleteSavedVisualization} disabled={!selectedSavedId}>
              <Trash2Icon className="size-4" />
              Delete
            </Button>
          </div>

          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <p className="font-medium">
              {isRunning ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Status"
              )}
            </p>
            <p className="text-muted-foreground">{statusMessage}</p>
          </div>

          <details className="rounded-md border bg-muted/10 p-2">
            <summary className="cursor-pointer text-sm font-medium">
              Data sample preview (first 5 rows)
            </summary>
            <Textarea value={rawPreview} readOnly className="mt-2 min-h-[140px] font-mono text-xs" />
          </details>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="flex flex-col gap-3">
          <CardTitle className="text-base">Visualization</CardTitle>
          <div className="flex flex-wrap gap-2 -mx-1">
            <Button
              size="sm"
              variant={selectedViz === "network" ? "default" : "outline"}
              onClick={() => setSelectedViz("network")}
            >
              <NetworkIcon className="size-4" />
              Network
            </Button>
            <Button
              size="sm"
              variant={selectedViz === "pie" ? "default" : "outline"}
              onClick={() => setSelectedViz("pie")}
            >
              <BarChart3Icon className="size-4" />
              Pie
            </Button>
            <Button
              size="sm"
              variant={selectedViz === "heatmap" ? "default" : "outline"}
              onClick={() => setSelectedViz("heatmap")}
            >
              <BarChart3Icon className="size-4" />
              Heatmap
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedViz === "network" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Relation map from detected categorical fields.
              </p>
              <NetworkGraph nodes={activeNetwork.nodes} edges={activeNetwork.edges} />
            </div>
          ) : selectedViz === "pie" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Distribution for:{" "}
                <span className="font-medium">
                  {pieData.selectedColumn ? formatFieldLabel(pieData.selectedColumn) : "n/a"}
                </span>
              </p>
              <PieChart
                labels={pieData.displayLabels}
                values={pieData.values}
                hoverLabels={pieData.labels}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Numeric correlation overview.
              </p>
              <HeatmapChart
                x={result?.visualizations.heatmap?.x ?? []}
                y={result?.visualizations.heatmap?.y ?? []}
                z={result?.visualizations.heatmap?.z ?? []}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
