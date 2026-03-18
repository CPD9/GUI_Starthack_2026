import { parsePrompt } from "@/lib/query/intent";
import type { QueryPlan } from "@/lib/query/types";

export const buildQueryPlan = (prompt: string): QueryPlan => {
  const parsed = parsePrompt(prompt);

  const rationale: string[] = [
    `Detected intent: ${parsed.intent}`,
    parsed.filters.metric
      ? `Selected metric: ${parsed.filters.metric}`
      : "No explicit metric found; using default metric.",
    parsed.filters.material
      ? `Detected material filter: ${parsed.filters.material}`
      : "No material filter detected.",
  ];

  if (parsed.intent === "trend") {
    rationale.push(
      parsed.filters.months
        ? `Using rolling window of ${parsed.filters.months} months.`
        : "No explicit time window detected; using full available history."
    );
  }

  if (parsed.intent === "comparison") {
    rationale.push(
      parsed.filters.machineA && parsed.filters.machineB
        ? `Comparing machine ${parsed.filters.machineA} against ${parsed.filters.machineB}.`
        : "No explicit machine pair found; falling back to default machine comparison."
    );
  }

  return {
    intent: parsed.intent,
    filters: parsed.filters,
    normalizedPrompt: parsed.normalizedPrompt,
    rationale,
  };
};
