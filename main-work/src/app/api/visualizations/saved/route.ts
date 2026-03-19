import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { PipelineNodeResponse } from "@/modules/visualizations/types";

const payloadSchema = z.object({
  name: z.string().min(1),
  selectedViz: z.string().min(1),
  result: z.any(),
});

type SavedVisualization = {
  id: string;
  name: string;
  selectedViz: string;
  createdAt: string;
  result: PipelineNodeResponse;
};

const storePath = () => join(process.cwd(), "data", "processed", "visualization-snapshots.json");

const readSnapshots = async (): Promise<SavedVisualization[]> => {
  try {
    const content = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(content) as SavedVisualization[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSnapshots = async (items: SavedVisualization[]) => {
  await mkdir(join(process.cwd(), "data", "processed"), { recursive: true });
  await writeFile(storePath(), JSON.stringify(items, null, 2), "utf8");
};

export async function GET() {
  const items = await readSnapshots();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid save request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, selectedViz, result } = parsed.data;
    const items = await readSnapshots();
    const nextItem: SavedVisualization = {
      id: crypto.randomUUID(),
      name,
      selectedViz,
      createdAt: new Date().toISOString(),
      result: result as PipelineNodeResponse,
    };
    const updated = [nextItem, ...items].slice(0, 30);
    await writeSnapshots(updated);

    return NextResponse.json({ ok: true, item: nextItem });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save visualization." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id query param." }, { status: 400 });
  }

  const items = await readSnapshots();
  const updated = items.filter((item) => item.id !== id);
  await writeSnapshots(updated);
  return NextResponse.json({ ok: true });
}
