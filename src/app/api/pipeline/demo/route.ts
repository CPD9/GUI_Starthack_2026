import { createReadStream } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import readline from "node:readline";
import Papa from "papaparse";
import { NextResponse } from "next/server";

import { runPipelineAction } from "@/lib/pipeline-service";
import type { DatasetRow, PipelineNodeResponse } from "@/modules/visualizations/types";

const SAMPLE_LINE_LIMIT = 600;

const pickFirstCsvFile = async (rawDir: string) => {
  const entries = await readdir(rawDir, { withFileTypes: true });
  const csvFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => entry.name)
    .sort();
  return csvFiles[0] ?? null;
};

const readCsvSample = async (filePath: string) => {
  const lines: string[] = [];
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lines.push(line);
    if (lines.length >= SAMPLE_LINE_LIMIT) {
      rl.close();
      break;
    }
  }

  return lines.join("\n");
};

const fallbackResult = (rows: DatasetRow[]): PipelineNodeResponse => {
  const firstColumn = rows.length ? Object.keys(rows[0])[0] : null;
  const secondColumn = rows.length ? Object.keys(rows[0])[1] : null;
  const counts: Record<string, number> = {};
  const nodes: Array<{ id: string; label: string; group: string; value: number }> = [];
  const edges: Array<{ source: string; target: string; weight: number }> = [];

  if (firstColumn) {
    for (const row of rows.slice(0, 300)) {
      const key = String(row[firstColumn] ?? "unknown");
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const topEntries = Object.entries(counts).slice(0, 12);
  for (const [label, value] of topEntries) {
    nodes.push({
      id: `${firstColumn}:${label}`,
      label,
      group: firstColumn ?? "field",
      value,
    });
  }
  if (nodes.length > 1) {
    for (let index = 0; index < nodes.length - 1; index += 1) {
      edges.push({
        source: nodes[index].id,
        target: nodes[index + 1].id,
        weight: Math.max(1, Math.round((nodes[index].value + nodes[index + 1].value) / 2)),
      });
    }
  }

  return {
    rows,
    metadata: { operation: "fallback-profile", row_count: rows.length },
    insights: {
      profile: {
        row_count: rows.length,
        column_count: rows.length ? Object.keys(rows[0]).length : 0,
        columns: rows.length ? Object.keys(rows[0]) : [],
        missing_ratio: {},
        distributions: firstColumn ? { [firstColumn]: counts } : {},
        correlation_heatmap: { x: [], y: [], z: [] },
        network: { nodes, edges },
      },
    },
    visualizations: {
      network: { nodes, edges },
      heatmap:
        secondColumn && firstColumn
          ? {
              x: [String(firstColumn), String(secondColumn)],
              y: [String(firstColumn), String(secondColumn)],
              z: [
                [1, 0.15],
                [0.15, 1],
              ],
            }
          : { x: [], y: [], z: [] },
      pie_candidates: firstColumn ? { [firstColumn]: counts } : {},
    },
    errors: [],
  };
};

export async function GET() {
  try {
    const rawDir = join(process.cwd(), "data", "raw");
    await mkdir(rawDir, { recursive: true });
    const csvName = await pickFirstCsvFile(rawDir);
    if (!csvName) {
      return NextResponse.json({
        ok: false,
        error: "No CSV file found in data/raw.",
      });
    }

    const csvPath = join(rawDir, csvName);
    const sampleText = await readCsvSample(csvPath);
    const parsed = Papa.parse(sampleText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    const rows = (parsed.data as DatasetRow[]).filter(
      (row) => Object.keys(row).length > 0
    );

    if (!rows.length) {
      return NextResponse.json({
        ok: false,
        error: "CSV sample did not contain data rows.",
      });
    }

    try {
      const profiled = await runPipelineAction(
        "profile",
        { rows, metadata: { source: csvName, sampled: true } },
        {}
      );
      return NextResponse.json({
        ok: true,
        sourceFile: csvName,
        sampledRows: rows.length,
        result: profiled,
      });
    } catch {
      return NextResponse.json({
        ok: true,
        sourceFile: csvName,
        sampledRows: rows.length,
        result: fallbackResult(rows),
        warning: "Pipeline service unavailable. Returned fallback visualization payload.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load demo CSV.",
      },
      { status: 500 }
    );
  }
}
