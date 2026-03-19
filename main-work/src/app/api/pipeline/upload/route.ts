import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ensureSafeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing CSV file upload." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "Only .csv files are supported." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = `${Date.now()}-${ensureSafeFilename(file.name)}`;
    const targetDir = join(process.cwd(), "data", "raw");
    await mkdir(targetDir, { recursive: true });
    const targetPath = join(targetDir, safeName);
    await writeFile(targetPath, bytes);

    return NextResponse.json({
      ok: true,
      filename: safeName,
      bytes: bytes.length,
      pathHint: `data/raw/${safeName}`,
    });
  } catch (error) {
    console.error("CSV upload route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload CSV." },
      { status: 500 }
    );
  }
}
