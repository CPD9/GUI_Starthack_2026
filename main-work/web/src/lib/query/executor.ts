import { mockMaterialData } from "@/lib/query/mock-material-data";
import type { QueryPlan, QueryResult } from "@/lib/query/types";
import { resolveMetric } from "@/lib/query/uuid-translator";

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const round = (value: number): number => Number(value.toFixed(2));

const byPlanFilters = (plan: QueryPlan) =>
  mockMaterialData.filter((row) => {
    if (plan.filters.material && row.material !== plan.filters.material) {
      return false;
    }

    return true;
  });

const executeSummary = async (plan: QueryPlan): Promise<QueryResult> => {
  const metric = await resolveMetric(plan);
  const rows = byPlanFilters(plan);
  const values = rows.map((row) => row.metrics[metric.id]).filter((value) => value != null);
  const avg = average(values);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  return {
    summary: `Summary for ${metric.label}: avg ${round(avg)}${metric.unit ? ` ${metric.unit}` : ""}, min ${round(min)}, max ${round(max)} across ${values.length} observations.`,
    explanation: [
      "Applied material filter (if provided) on sample observations.",
      `Computed descriptive statistics for metric '${metric.id}'.`,
      "Returned bar chart for min/avg/max overview.",
    ],
    metric,
    chart: {
      type: "bar",
      title: `${metric.label} summary`,
      x: ["Min", "Avg", "Max"],
      series: [{ name: metric.label, values: [round(min), round(avg), round(max)] }],
    },
  };
};

const executeTrend = async (plan: QueryPlan): Promise<QueryResult> => {
  const metric = await resolveMetric(plan);
  const rows = byPlanFilters(plan)
    .slice()
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const points = rows.map((row) => ({
    x: row.timestamp.slice(0, 7),
    y: row.metrics[metric.id],
  }));

  const filteredPoints = points.filter((point) => point.y != null);
  const first = filteredPoints[0]?.y ?? 0;
  const last = filteredPoints[filteredPoints.length - 1]?.y ?? 0;
  const delta = round(last - first);
  const direction = delta === 0 ? "stable" : delta > 0 ? "increasing" : "decreasing";

  return {
    summary: `${metric.label} trend appears ${direction} over ${filteredPoints.length} points (delta ${delta}${metric.unit ? ` ${metric.unit}` : ""}).`,
    explanation: [
      "Sorted observations by timestamp.",
      "Selected metric values for each period.",
      "Estimated trend direction from first-to-last delta.",
    ],
    metric,
    chart: {
      type: "line",
      title: `${metric.label} trend`,
      x: filteredPoints.map((point) => point.x),
      series: [{ name: metric.label, values: filteredPoints.map((point) => round(point.y)) }],
    },
  };
};

const executeComparison = async (plan: QueryPlan): Promise<QueryResult> => {
  const metric = await resolveMetric(plan);
  const machineA = plan.filters.machineA ?? "A";
  const machineB = plan.filters.machineB ?? "B";

  const scoped = byPlanFilters(plan);
  const valuesA = scoped
    .filter((row) => row.machine === machineA)
    .map((row) => row.metrics[metric.id])
    .filter((value) => value != null);
  const valuesB = scoped
    .filter((row) => row.machine === machineB)
    .map((row) => row.metrics[metric.id])
    .filter((value) => value != null);

  const meanA = round(average(valuesA));
  const meanB = round(average(valuesB));
  const delta = round(meanA - meanB);
  const winner =
    delta === 0 ? "Neither machine (tie)" : delta > 0 ? `Machine ${machineA}` : `Machine ${machineB}`;

  return {
    summary: `${winner} shows higher ${metric.label} on average. Mean(A)=${meanA}, Mean(B)=${meanB}, delta=${delta}.`,
    explanation: [
      `Scoped records to machines ${machineA} and ${machineB}.`,
      `Computed per-machine means for '${metric.id}'.`,
      "Reported difference as Machine A minus Machine B.",
    ],
    metric,
    chart: {
      type: "bar",
      title: `${metric.label}: Machine ${machineA} vs ${machineB}`,
      x: [`Machine ${machineA}`, `Machine ${machineB}`],
      series: [{ name: metric.label, values: [meanA, meanB] }],
    },
  };
};

export const executeQueryPlan = async (plan: QueryPlan): Promise<QueryResult> => {
  if (plan.intent === "trend") {
    return executeTrend(plan);
  }

  if (plan.intent === "comparison") {
    return executeComparison(plan);
  }

  return executeSummary(plan);
};
