import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { inngest } from "@/inngest/client";

const automationSchema = z.object({
  name: z.string().min(3),
  trigger: z.enum(["manual", "schedule", "webhook"]).default("manual"),
  payload: z.record(z.unknown()).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = automationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid automation request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    await inngest.send({
      name: "automation/run.requested",
      data: {
        runId,
        ...parsed.data,
        startedAt,
      },
    });

    return NextResponse.json({
      runId,
      status: "queued",
      startedAt,
      message: "Automation run queued successfully.",
    });
  } catch (error) {
    console.error("Automation route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to queue automation run.",
      },
      { status: 500 }
    );
  }
}
