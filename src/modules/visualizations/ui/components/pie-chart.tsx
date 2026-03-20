"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  values: number[];
  labels: string[];
  /** Full labels for tooltips; falls back to labels if not provided */
  hoverLabels?: string[];
}

export const PieChart = ({ values, labels, hoverLabels }: Props) => {
  if (!values.length || !labels.length) {
    return (
      <div className="min-h-[280px] sm:min-h-[320px] flex items-center justify-center border border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No pie chart data available.</p>
      </div>
    );
  }

  const tooltipLabels = hoverLabels ?? labels;

  return (
    <div className="w-full min-h-[280px] sm:min-h-[340px] md:min-h-[380px]">
      <Plot
        data={[
          {
            values,
            labels,
            type: "pie",
            hole: 0.4,
            textinfo: "percent",
            textposition: "inside",
            insidetextorientation: "radial",
            hovertemplate:
              "%{customdata}<br>%{percent}<extra></extra>",
            customdata: tooltipLabels,
          },
        ]}
        layout={{
          autosize: true,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          margin: { l: 8, r: 8, t: 16, b: 8 },
          showlegend: true,
          legend: {
            orientation: "h",
            y: -0.08,
            x: 0.5,
            xanchor: "center",
            font: { size: 11 },
            traceorder: "reversed",
          },
        }}
        style={{ width: "100%", height: "100%", minHeight: "280px" }}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
      />
    </div>
  );
};
