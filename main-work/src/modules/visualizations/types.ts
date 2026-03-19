export type PipelineAction =
  | "clean"
  | "normalize"
  | "split"
  | "concat"
  | "model"
  | "profile"
  | "pivot";

export type DatasetRow = Record<string, string | number | boolean | null>;

export type PipelineDataset = {
  rows: DatasetRow[];
  metadata?: Record<string, unknown>;
};

export type PipelineNodeResponse = {
  rows: DatasetRow[];
  metadata: Record<string, unknown>;
  insights: {
    profile?: {
      row_count: number;
      column_count: number;
      columns: string[];
      missing_ratio: Record<string, number>;
      distributions: Record<string, Record<string, number>>;
      correlation_heatmap: { x: string[]; y: string[]; z: number[][] };
      network: {
        nodes: Array<{ id: string; label: string; group: string; value: number }>;
        edges: Array<{ source: string; target: string; weight: number }>;
      };
    };
    model?: Record<string, unknown>;
  };
  visualizations: {
    network?: {
      nodes: Array<{ id: string; label: string; group: string; value: number }>;
      edges: Array<{ source: string; target: string; weight: number }>;
    };
    heatmap?: { x: string[]; y: string[]; z: number[][] };
    pie_candidates?: Record<string, Record<string, number>>;
  };
  errors: string[];
};

export type AutomationRunStatus = "queued" | "running" | "completed" | "failed";

export type AutomationRunResponse = {
  runId: string;
  status: AutomationRunStatus;
  startedAt: string;
  message: string;
};
