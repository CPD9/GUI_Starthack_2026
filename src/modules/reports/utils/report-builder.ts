import type { PipelineNodeResponse } from "@/modules/visualizations/types";

const truncateLabel = (label: string, maxLen = 20): string => {
  const s = String(label).trim();
  if (s.length <= maxLen) return s;
  const parts = s.split(/[.-]/);
  const last = parts.filter(Boolean).pop();
  if (last && last.length <= maxLen) return last;
  return s.slice(0, maxLen - 1) + "…";
};

export type ReportRequestInput = {
  title?: string;
  statusMessage: string;
  selectedVisualization: string;
  result: PipelineNodeResponse | null;
  chartNotes?: string[];
};

export const buildReportPayload = ({
  title,
  statusMessage,
  selectedVisualization,
  result,
  chartNotes: extraChartNotes,
}: ReportRequestInput) => {
  const pieCandidates = result?.visualizations.pie_candidates ?? {};
  const pieKey = Object.keys(pieCandidates)[0];
  const pieEntries = pieKey
    ? Object.entries(pieCandidates[pieKey]).slice(0, 8)
    : [];
  const pieLabels = pieEntries.map(([l]) => truncateLabel(String(l)));
  const pieValues = pieEntries.map(([, v]) => Number(v));

  const heatmap = result?.visualizations.heatmap;
  const heatmapData =
    heatmap?.x?.length && heatmap?.y?.length && heatmap?.z?.length
      ? { x: heatmap.x.slice(0, 8), y: heatmap.y.slice(0, 8), z: heatmap.z }
      : null;

  const modelInsights = result?.insights.model;
  const hasModelInsights =
    modelInsights && typeof modelInsights === "object" && Object.keys(modelInsights).length > 0;

  return {
    title: title ?? "Zwick/Roell Analytics Summary",
    generatedAt: new Date().toISOString(),
    summary: [
      statusMessage,
      `Rows in dataset: ${result?.rows.length ?? 0}`,
      `Selected visualization: ${selectedVisualization}`,
      `Columns detected: ${result?.insights.profile?.column_count ?? 0}`,
    ],
    modelInsights: hasModelInsights ? modelInsights : undefined,
    chartNotes: [
      `Network nodes: ${result?.visualizations.network?.nodes.length ?? 0}`,
      `Network edges: ${result?.visualizations.network?.edges.length ?? 0}`,
      `Heatmap: ${heatmap?.x?.length ?? 0}×${heatmap?.y?.length ?? 0}`,
      `Pie categories: ${pieLabels.length}`,
      ...(extraChartNotes ?? []),
    ],
    pieChart: pieLabels.length > 0 ? { labels: pieLabels, values: pieValues } : null,
    heatmap: heatmapData,
    keyMetrics: {
      rows: result?.rows.length ?? 0,
      columns: result?.insights.profile?.column_count ?? 0,
      networkNodes: result?.visualizations.network?.nodes.length ?? 0,
      pieCategories: pieLabels.length,
    },
  };
};
