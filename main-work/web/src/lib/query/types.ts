export type QueryIntent = "summary" | "trend" | "comparison";

export type QueryFilters = {
  material?: string;
  metric?: string;
  machineA?: string;
  machineB?: string;
  months?: number;
};

export type QueryPlan = {
  intent: QueryIntent;
  filters: QueryFilters;
  normalizedPrompt: string;
  rationale: string[];
};

export type ChartSpec = {
  type: "line" | "bar";
  title: string;
  x: string[];
  series: Array<{
    name: string;
    values: number[];
  }>;
};

export type QueryResult = {
  summary: string;
  explanation: string[];
  chart: ChartSpec | null;
  metric: {
    id: string;
    label: string;
    unit: string | null;
  };
};
