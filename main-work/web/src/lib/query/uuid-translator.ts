import { readFile } from "node:fs/promises";
import type { QueryPlan } from "@/lib/query/types";

type MetricTranslation = {
  label: string;
  unit: string | null;
};

const defaultTranslations: Record<string, MetricTranslation> = {
  tensile_strength: { label: "Tensile strength", unit: "MPa" },
  elongation_at_break: { label: "Elongation at break", unit: "%" },
  yield_strength: { label: "Yield strength", unit: "MPa" },
  impact_energy: { label: "Impact energy", unit: "J" },
};

let cachedExternalMap: Record<string, MetricTranslation> | null = null;

const normalizeMetricId = (value: string): string => {
  if (!value.includes(".")) {
    return value.trim();
  }
  const segments = value.split(".");
  return segments[segments.length - 1]?.trim() ?? value.trim();
};

const prettify = (metricId: string): string =>
  metricId
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const parseExternalMap = (
  input: unknown
): Record<string, MetricTranslation> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const result: Record<string, MetricTranslation> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }
    const label =
      typeof value.label === "string" ? value.label : prettify(normalizeMetricId(key));
    const unit = typeof value.unit === "string" ? value.unit : null;
    result[normalizeMetricId(key)] = { label, unit };
  }

  return result;
};

const loadExternalMap = async (): Promise<Record<string, MetricTranslation>> => {
  if (cachedExternalMap) {
    return cachedExternalMap;
  }

  const mapPath = process.env.UUID_TRANSLATIONS_PATH;
  if (!mapPath) {
    cachedExternalMap = {};
    return cachedExternalMap;
  }

  try {
    const file = await readFile(mapPath, "utf-8");
    const parsed = JSON.parse(file) as unknown;
    cachedExternalMap = parseExternalMap(parsed);
  } catch {
    cachedExternalMap = {};
  }

  return cachedExternalMap;
};

export const resolveMetric = async (plan: QueryPlan) => {
  const candidate = plan.filters.metric ?? "tensile_strength";

  if (candidate.endsWith("_key")) {
    return {
      id: candidate,
      label: `${prettify(candidate)} (ignored key field)`,
      unit: null,
    };
  }

  const normalized = normalizeMetricId(candidate);
  const externalMap = await loadExternalMap();
  const external = externalMap[normalized];
  if (external) {
    return { id: normalized, ...external };
  }

  const builtIn = defaultTranslations[normalized];
  if (builtIn) {
    return { id: normalized, ...builtIn };
  }

  return {
    id: normalized,
    label: prettify(normalized),
    unit: null,
  };
};
