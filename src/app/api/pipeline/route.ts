import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { runPipelineAction } from "@/lib/pipeline-service";

const rowSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.null()])
);

const requestSchema = z.object({
  action: z.enum([
    "clean",
    "normalize",
    "split",
    "concat",
    "model",
    "profile",
    "pivot",
  ]),
  dataset: z.object({
    rows: z.array(rowSchema),
    metadata: z.record(z.unknown()).optional(),
  }),
  params: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid pipeline request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, dataset, params } = parsed.data;
    const result = await runPipelineAction(action, dataset, params ?? {});

    return NextResponse.json({
      ok: true,
      action,
      result,
    });
  } catch (error) {
    console.error("Pipeline API error:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected pipeline execution error",
      },
      { status: 500 }
    );
  }
}
