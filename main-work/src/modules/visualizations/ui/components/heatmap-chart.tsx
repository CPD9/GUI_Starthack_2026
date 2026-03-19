"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  x: string[];
  y: string[];
  z: number[][];
}

export const HeatmapChart = ({ x, y, z }: Props) => {
  if (!x.length || !y.length || !z.length) {
    return (
      <div className="min-h-[280px] sm:min-h-[320px] flex items-center justify-center border border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No heatmap data available.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[280px] sm:min-h-[320px] md:min-h-[380px]">
      <Plot
        data={[
          {
            x,
            y,
            z,
            type: "heatmap",
            colorscale: "RdBu",
            reversescale: true,
            zmin: -1,
            zmax: 1,
          },
        ]}
        layout={{
          autosize: true,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          margin: { l: 60, r: 10, t: 16, b: 50 },
        }}
        style={{ width: "100%", height: "100%", minHeight: "280px" }}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
      />
    </div>
  );
};
