"use client";

import type { CSSProperties } from "react";
import type { ChartSpec } from "@/lib/query/types";

const colors = ["#67b7ff", "#82e8be", "#f9c874", "#ff8ca1"];

const chartCardStyle: CSSProperties = {
  border: "1px solid #24324f",
  borderRadius: 10,
  padding: 12,
  background: "#09101c",
  display: "grid",
  gap: 10,
};

const getMinMax = (series: Array<{ values: number[] }>) => {
  const allValues = series.flatMap((item) => item.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
};

const scaleY = (value: number, min: number, max: number, height: number): number =>
  height - ((value - min) / (max - min)) * (height - 8) - 4;

const renderLineChart = (chart: ChartSpec) => {
  const width = 660;
  const height = 220;
  const paddingX = 30;
  const effectiveWidth = width - paddingX * 2;
  const { min, max } = getMinMax(chart.series);
  const pointCount = Math.max(chart.x.length, 2);
  const stepX = effectiveWidth / (pointCount - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      <rect x="0" y="0" width={width} height={height} fill="#0b1422" rx="8" />
      {[0, 1, 2, 3, 4].map((lineIndex) => {
        const y = (height / 4) * lineIndex;
        return (
          <line
            key={`grid-${lineIndex}`}
            x1={paddingX}
            y1={y}
            x2={width - paddingX}
            y2={y}
            stroke="#213251"
            strokeWidth="1"
            opacity="0.8"
          />
        );
      })}
      {chart.series.map((serie, seriesIndex) => {
        const points = serie.values
          .map((value, valueIndex) => {
            const x = paddingX + stepX * valueIndex;
            const y = scaleY(value, min, max, height);
            return `${x},${y}`;
          })
          .join(" ");

        return (
          <g key={serie.name}>
            <polyline
              fill="none"
              stroke={colors[seriesIndex % colors.length]}
              strokeWidth="2.5"
              points={points}
            />
            {serie.values.map((value, valueIndex) => {
              const x = paddingX + stepX * valueIndex;
              const y = scaleY(value, min, max, height);
              return (
                <circle
                  key={`${serie.name}-${valueIndex}`}
                  cx={x}
                  cy={y}
                  r="3.8"
                  fill={colors[seriesIndex % colors.length]}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

const renderBarChart = (chart: ChartSpec) => {
  const width = 660;
  const height = 220;
  const paddingX = 36;
  const { min, max } = getMinMax(chart.series);
  const categories = chart.x.length;
  const seriesCount = chart.series.length || 1;
  const groupWidth = (width - paddingX * 2) / Math.max(categories, 1);
  const innerWidth = groupWidth * 0.7;
  const barWidth = innerWidth / seriesCount;
  const maxBarHeight = height - 30;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
      <rect x="0" y="0" width={width} height={height} fill="#0b1422" rx="8" />
      <line
        x1={paddingX}
        y1={height - 18}
        x2={width - paddingX}
        y2={height - 18}
        stroke="#2a3c61"
        strokeWidth="1.2"
      />
      {chart.x.map((label, xIndex) => (
        <text
          key={`x-${label}-${xIndex}`}
          x={paddingX + groupWidth * xIndex + groupWidth / 2}
          y={height - 3}
          textAnchor="middle"
          fill="#9db4df"
          fontSize="10"
        >
          {label}
        </text>
      ))}
      {chart.series.map((serie, seriesIndex) =>
        serie.values.map((value, valueIndex) => {
          const normalized = (value - min) / (max - min);
          const barHeight = Math.max(2, normalized * maxBarHeight);
          const x =
            paddingX +
            groupWidth * valueIndex +
            (groupWidth - innerWidth) / 2 +
            barWidth * seriesIndex;
          const y = height - 18 - barHeight;

          return (
            <rect
              key={`${serie.name}-${valueIndex}`}
              x={x}
              y={y}
              width={Math.max(barWidth - 2, 4)}
              height={barHeight}
              rx={3}
              fill={colors[seriesIndex % colors.length]}
            />
          );
        })
      )}
    </svg>
  );
};

type Props = {
  chart: ChartSpec;
};

export const ChartPreview = ({ chart }: Props) => {
  return (
    <div style={chartCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <strong>{chart.title}</strong>
        <span style={{ color: "#8da4d3", fontSize: 13 }}>{chart.type.toUpperCase()}</span>
      </div>
      {chart.type === "line" ? renderLineChart(chart) : renderBarChart(chart)}
      <div style={{ color: "#8da4d3", fontSize: 12 }}>
        Axes: {chart.x.length} categories, {chart.series.length} series
      </div>
    </div>
  );
};
