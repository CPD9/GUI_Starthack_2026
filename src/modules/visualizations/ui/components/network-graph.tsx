"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Node = { id: string; label: string; group: string; value: number };
type Edge = { source: string; target: string; weight: number };

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export const NetworkGraph = ({ nodes, edges }: Props) => {
  if (!nodes.length || !edges.length) {
    return (
      <div className="min-h-[280px] sm:min-h-[320px] flex items-center justify-center border border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">No network relationships available.</p>
      </div>
    );
  }

  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const x: number[] = [];
  const y: number[] = [];
  const labels: string[] = [];
  const colors: string[] = [];
  const sizes: number[] = [];

  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    x.push(Math.cos(angle));
    y.push(Math.sin(angle));
    labels.push(node.label);
    colors.push(node.group);
    sizes.push(Math.max(8, Math.min(30, node.value / 2)));
  });

  const edgeX: (number | null)[] = [];
  const edgeY: (number | null)[] = [];
  edges.forEach((edge) => {
    const sIdx = indexById.get(edge.source);
    const tIdx = indexById.get(edge.target);
    if (sIdx === undefined || tIdx === undefined) return;
    edgeX.push(x[sIdx], x[tIdx], null);
    edgeY.push(y[sIdx], y[tIdx], null);
  });

  return (
    <div className="w-full min-h-[280px] sm:min-h-[320px] md:min-h-[380px]">
    <Plot
      data={[
        {
          x: edgeX,
          y: edgeY,
          mode: "lines",
          type: "scatter",
          line: { color: "rgba(120,120,160,0.35)", width: 1 },
          hoverinfo: "skip",
        },
        {
          x,
          y,
          text: labels,
          mode: "text+markers",
          type: "scatter",
          textposition: "top center",
          marker: {
            color: colors,
            size: sizes,
            line: { color: "white", width: 0.5 },
            opacity: 0.9,
          },
        },
      ]}
      layout={{
        autosize: true,
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 10, r: 10, t: 10, b: 10 },
        showlegend: false,
        xaxis: { visible: false },
        yaxis: { visible: false },
      }}
      style={{ width: "100%", height: "100%", minHeight: "280px" }}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
    />
    </div>
  );
};
