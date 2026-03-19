import type { PipelineAction, PipelineDataset, PipelineNodeResponse } from "@/modules/visualizations/types";

const defaultBaseUrl = "http://localhost:8100";

const getBaseUrl = () =>
  process.env.PIPELINE_SERVICE_URL?.replace(/\/$/, "") ?? defaultBaseUrl;

export const runPipelineAction = async (
  action: PipelineAction,
  dataset: PipelineDataset,
  params: Record<string, unknown> = {}
): Promise<PipelineNodeResponse> => {
  const baseUrl = getBaseUrl();
  const endpoint = action === "pivot" ? "/pipeline/reshape/pivot" : `/pipeline/${action}`;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pipeline service failed (${response.status}): ${text}`);
  }

  return (await response.json()) as PipelineNodeResponse;
};
