import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";

const reportSchema = z.object({
  title: z.string().default("Analytics Report"),
  generatedAt: z.string().optional(),
  summary: z.array(z.string()).default([]),
  modelInsights: z.record(z.unknown()).optional(),
  chartNotes: z.array(z.string()).default([]),
  pieChart: z
    .object({
      labels: z.array(z.string()),
      values: z.array(z.number()),
    })
    .nullable()
    .optional(),
  heatmap: z
    .object({
      x: z.array(z.string()),
      y: z.array(z.string()),
      z: z.array(z.array(z.number())),
    })
    .nullable()
    .optional(),
  keyMetrics: z
    .object({
      rows: z.number(),
      columns: z.number(),
      networkNodes: z.number(),
      pieCategories: z.number(),
    })
    .optional(),
});

const PIE_COLORS = [
  "#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#65a30d", "#db2777",
];

async function fetchChartImage(
  chartConfig: Record<string, unknown>,
  width = 380,
  height = 240
): Promise<ArrayBuffer | null> {
  try {
    const encoded = encodeURIComponent(JSON.stringify(chartConfig));
    const url = `https://quickchart.io/chart?c=${encoded}&width=${width}&height=${height}&backgroundColor=white&format=png`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

const addWrappedText = (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: PDFFont,
  size: number,
  color = rgb(0.2, 0.2, 0.25)
) => {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(testLine, size);
    if (lineWidth > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color });
      cursorY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: cursorY, size, font, color });
    cursorY -= lineHeight;
  }

  return cursorY;
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const generatedAt = payload.generatedAt ?? new Date().toISOString();
    const displayDate = formatDate(generatedAt);

    // Header - cleaner, more professional
    const headerBg = rgb(0.06, 0.12, 0.24);
    page.drawRectangle({
      x: 0,
      y: 545,
      width: 842,
      height: 50,
      color: headerBg,
    });
    page.drawText(payload.title, {
      x: 40,
      y: 565,
      size: 20,
      font: titleFont,
      color: rgb(1, 1, 1),
    });
    page.drawText(`Generated ${displayDate}`, {
      x: 40,
      y: 550,
      size: 9,
      font: bodyFont,
      color: rgb(0.85, 0.88, 0.95),
    });

    let y = 515;

    // Key metrics - card-style boxes
    if (payload.keyMetrics) {
      const m = payload.keyMetrics;
      const metrics = [
        { label: "Rows", value: String(m.rows) },
        { label: "Columns", value: String(m.columns) },
        { label: "Categories", value: String(m.pieCategories) },
        { label: "Network nodes", value: String(m.networkNodes) },
      ];
      const boxWidth = 180;
      const gap = 12;
      let mx = 40;

      for (const metric of metrics) {
        page.drawRectangle({
          x: mx,
          y: y - 42,
          width: boxWidth,
          height: 42,
          borderColor: rgb(0.85, 0.88, 0.92),
          borderWidth: 0.5,
        });
        page.drawText(metric.label, {
          x: mx + 12,
          y: y - 22,
          size: 9,
          font: bodyFont,
          color: rgb(0.45, 0.5, 0.55),
        });
        page.drawText(metric.value, {
          x: mx + 12,
          y: y - 38,
          size: 16,
          font: titleFont,
          color: rgb(0.12, 0.2, 0.35),
        });
        mx += boxWidth + gap;
      }
      y -= 60;
    }

    // Summary section - cleaner bullets
    page.drawText("Summary", {
      x: 40,
      y,
      size: 12,
      font: titleFont,
      color: rgb(0.12, 0.2, 0.35),
    });
    y -= 18;

    for (const item of payload.summary.slice(0, 6)) {
      page.drawText("•", { x: 42, y, size: 10, font: bodyFont, color: rgb(0.4, 0.5, 0.6) });
      y = addWrappedText(page, item, 56, y, 760, 13, bodyFont, 10);
      y -= 4;
      if (y < 220) break;
    }
    y -= 16;

    // Charts row
    let chartY = y;
    const chartWidth = 360;
    const chartHeight = 220;

    if (payload.pieChart && payload.pieChart.labels.length > 0) {
      const pieConfig = {
        type: "doughnut",
        data: {
          labels: payload.pieChart.labels,
          datasets: [
            {
              data: payload.pieChart.values,
              backgroundColor: PIE_COLORS.slice(0, payload.pieChart.labels.length),
              borderWidth: 1,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          legend: {
            position: "bottom",
            labels: { fontSize: 10, boxWidth: 12 },
          },
          layout: { padding: 12 },
        },
      };

      const pieImg = await fetchChartImage(pieConfig, chartWidth, chartHeight);
      if (pieImg) {
        const png = await pdfDoc.embedPng(pieImg);
        const scale = Math.min(chartWidth / png.width, chartHeight / png.height) * 0.95;
        page.drawImage(png, {
          x: 40,
          y: chartY - chartHeight,
          width: png.width * scale,
          height: png.height * scale,
        });
      }
    }

    // Bar chart from heatmap - mean correlation strength per variable
    if (payload.heatmap && payload.heatmap.x.length > 0 && payload.heatmap.z.length > 0) {
      const labels = payload.heatmap.x.slice(0, 6).map((l) => (l.length > 12 ? l.slice(0, 11) + "…" : l));
      const values = labels.map((_, colIdx) => {
        let sum = 0;
        let count = 0;
        for (let row = 0; row < payload.heatmap!.z.length; row++) {
          const v = payload.heatmap!.z[row]?.[colIdx];
          if (typeof v === "number") {
            sum += Math.abs(v);
            count++;
          }
        }
        return count > 0 ? Math.round((sum / count) * 100) : 0;
      });

      const barConfig = {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Correlation strength",
              data: values,
              backgroundColor: "rgba(37, 99, 235, 0.7)",
              borderColor: "#2563eb",
              borderWidth: 1,
            },
          ],
        },
        options: {
          legend: { display: false },
          scales: {
            xAxes: [{ ticks: { maxRotation: 45, fontSize: 9 } }],
            yAxes: [{ ticks: { beginAtZero: true, max: 100, fontSize: 9 } }],
          },
          layout: { padding: 8 },
        },
      };

      const barImg = await fetchChartImage(barConfig, chartWidth, chartHeight);
      if (barImg) {
        const png = await pdfDoc.embedPng(barImg);
        const scale = Math.min(chartWidth / png.width, chartHeight / png.height) * 0.95;
        page.drawImage(png, {
          x: 430,
          y: chartY - chartHeight,
          width: png.width * scale,
          height: png.height * scale,
        });
      }
    }

    y = chartY - chartHeight - 24;

    // Chart notes - compact
    if (payload.chartNotes.length > 0) {
      page.drawText("Dataset overview", {
        x: 40,
        y,
        size: 11,
        font: titleFont,
        color: rgb(0.12, 0.2, 0.35),
      });
      y -= 14;

      const notesText = payload.chartNotes.slice(0, 5).join("  •  ");
      y = addWrappedText(page, notesText, 40, y, 760, 12, bodyFont, 9, rgb(0.4, 0.45, 0.55));
      y -= 16;
    }

    // Model insights - only if we have meaningful data
    if (payload.modelInsights && Object.keys(payload.modelInsights).length > 0) {
      const modelText = JSON.stringify(payload.modelInsights, null, 2).slice(0, 1200);
      page.drawText("Model insights", {
        x: 40,
        y,
        size: 11,
        font: titleFont,
        color: rgb(0.12, 0.2, 0.35),
      });
      y -= 14;
      y = addWrappedText(page, modelText, 40, y, 760, 11, bodyFont, 9, rgb(0.35, 0.4, 0.5));
    }

    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="analytics-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Report generation failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF report.",
      },
      { status: 500 }
    );
  }
}
