import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { queryRuns, querySessions } from "@/db/schema";
import { executeQueryPlan } from "@/lib/query/executor";
import { buildQueryPlan } from "@/lib/query/planner";

const requestSchema = z.object({
  prompt: z.string().min(5),
  sessionId: z.string().uuid().optional(),
});

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

const ensureSession = async (prompt: string, providedSessionId?: string) => {
  if (!hasDatabase()) {
    return providedSessionId ?? crypto.randomUUID();
  }

  const db = getDb();

  if (providedSessionId) {
    const existing = await db
      .select({ id: querySessions.id })
      .from(querySessions)
      .where(eq(querySessions.id, providedSessionId))
      .limit(1);
    if (existing[0]) {
      return existing[0].id;
    }
  }

  const title = prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt;
  const created = await db.insert(querySessions).values({ title }).returning({
    id: querySessions.id,
  });

  return created[0].id;
};

const createRun = async (sessionId: string, prompt: string, queryPlan: unknown) => {
  if (!hasDatabase()) {
    return crypto.randomUUID();
  }

  const db = getDb();
  const created = await db
    .insert(queryRuns)
    .values({
      sessionId,
      prompt,
      status: "queued",
      queryPlan,
    })
    .returning({ id: queryRuns.id });

  return created[0].id;
};

const updateRunStatus = async (
  runId: string,
  payload: Partial<{
    status: "running" | "completed" | "failed";
    resultPayload: unknown;
    errorMessage: string;
    queryPlan: unknown;
  }>
) => {
  if (!hasDatabase()) {
    return;
  }

  const db = getDb();
  await db
    .update(queryRuns)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(queryRuns.id, runId));
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prompt, sessionId: providedSessionId } = parsed.data;
  const queryPlan = buildQueryPlan(prompt);

  let sessionId = providedSessionId ?? crypto.randomUUID();
  let runId = crypto.randomUUID();

  try {
    sessionId = await ensureSession(prompt, providedSessionId);
    runId = await createRun(sessionId, prompt, queryPlan);
  } catch (error) {
    console.error("Failed to initialize persisted query run. Continuing in memory.", {
      error,
    });
  }

  try {
    await updateRunStatus(runId, { status: "running", queryPlan });
    const result = await executeQueryPlan(queryPlan);
    await updateRunStatus(runId, {
      status: "completed",
      resultPayload: result,
    });

    return NextResponse.json({
      runId,
      sessionId,
      persisted: hasDatabase(),
      queryPlan,
      result,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown query execution error";
    await updateRunStatus(runId, {
      status: "failed",
      errorMessage,
    });

    return NextResponse.json(
      {
        runId,
        sessionId,
        persisted: hasDatabase(),
        error: "Query execution failed.",
        errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({
      runs: [],
      persisted: false,
      message: "DATABASE_URL is not set. Query history is unavailable.",
    });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const limit = Number(url.searchParams.get("limit") ?? "20");

  const db = getDb();
  const selectedColumns = {
    id: queryRuns.id,
    sessionId: queryRuns.sessionId,
    prompt: queryRuns.prompt,
    status: queryRuns.status,
    createdAt: queryRuns.createdAt,
    updatedAt: queryRuns.updatedAt,
  };
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;

  const runs = sessionId
    ? await db
        .select(selectedColumns)
        .from(queryRuns)
        .where(eq(queryRuns.sessionId, sessionId))
        .orderBy(desc(queryRuns.createdAt))
        .limit(safeLimit)
    : await db
        .select(selectedColumns)
        .from(queryRuns)
        .orderBy(desc(queryRuns.createdAt))
        .limit(safeLimit);

  return NextResponse.json({ runs, persisted: true });
}
