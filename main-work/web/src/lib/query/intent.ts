import type { QueryFilters, QueryIntent } from "@/lib/query/types";

const monthMatch = (prompt: string): number | undefined => {
  const match = prompt.match(/last\s+(\d+)\s+month/);
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

const detectIntent = (prompt: string): QueryIntent => {
  const comparisonSignals = ["compare", "vs", "versus", "difference", "differ"];
  if (comparisonSignals.some((signal) => prompt.includes(signal))) {
    return "comparison";
  }

  const trendSignals = ["trend", "drift", "over time", "decreasing", "increasing"];
  if (trendSignals.some((signal) => prompt.includes(signal))) {
    return "trend";
  }

  return "summary";
};

const detectMetric = (prompt: string): string | undefined => {
  const metricKeywordMap: Array<{ keywords: string[]; metric: string }> = [
    {
      keywords: ["tensile strength", "uts", "ultimate tensile strength"],
      metric: "tensile_strength",
    },
    {
      keywords: ["elongation", "elongation at break"],
      metric: "elongation_at_break",
    },
    {
      keywords: ["yield strength", "yield"],
      metric: "yield_strength",
    },
    {
      keywords: ["impact", "charpy"],
      metric: "impact_energy",
    },
  ];

  for (const item of metricKeywordMap) {
    if (item.keywords.some((keyword) => prompt.includes(keyword))) {
      return item.metric;
    }
  }

  return undefined;
};

const detectMaterial = (prompt: string): string | undefined => {
  const materials = ["steel", "aluminum", "aluminium", "plastic", "polymer"];
  const found = materials.find((candidate) => prompt.includes(candidate));
  if (found === "aluminium") {
    return "aluminum";
  }
  return found;
};

const detectMachines = (
  prompt: string
): Pick<QueryFilters, "machineA" | "machineB"> => {
  const machineMatch = prompt.match(
    /machine\s+([a-z0-9_-]+)\s*(?:vs|versus|and)\s*machine\s+([a-z0-9_-]+)/i
  );

  if (!machineMatch) {
    return {};
  }

  return {
    machineA: machineMatch[1].toUpperCase(),
    machineB: machineMatch[2].toUpperCase(),
  };
};

export const parsePrompt = (
  rawPrompt: string
): { intent: QueryIntent; filters: QueryFilters; normalizedPrompt: string } => {
  const normalizedPrompt = rawPrompt.trim().toLowerCase();
  const intent = detectIntent(normalizedPrompt);

  return {
    intent,
    filters: {
      months: monthMatch(normalizedPrompt),
      metric: detectMetric(normalizedPrompt),
      material: detectMaterial(normalizedPrompt),
      ...detectMachines(normalizedPrompt),
    },
    normalizedPrompt,
  };
};
