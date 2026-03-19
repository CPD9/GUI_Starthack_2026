"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3Icon,
  NetworkIcon,
  DownloadIcon,
  PlusIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkledBackground } from "@/components/sparkled";

export const VisualizationsView = () => {
  const { resolvedTheme } = useTheme();
  const [selectedViz, setSelectedViz] = useState<string | null>(null);
  const [showSparkle, setShowSparkle] = useState(true);
  const sparkleColor =
    resolvedTheme === "light" ? "15, 23, 42" : "255, 255, 255";

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Visualizations</h1>
          <p className="text-muted-foreground">
            Create and export data visualizations for your lab testing results
          </p>
        </div>
        <Button>
          <PlusIcon className="size-4" />
          New Visualization
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="glass cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setSelectedViz("network")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <NetworkIcon className="size-6 text-primary" />
              <CardTitle className="text-lg">Network Graph</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cluster-based network maps to visualize relationships and patterns
              in your test data
            </p>
          </CardContent>
        </Card>

        <Card
          className="glass cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setSelectedViz("charts")}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3Icon className="size-6 text-primary" />
              <CardTitle className="text-lg">Charts & Plots</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bar charts, line graphs, and scatter plots for batch comparisons
            </p>
          </CardContent>
        </Card>

        <Card className="glass opacity-75">
          <CardHeader>
            <CardTitle className="text-lg">More coming soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Heatmaps, distribution plots, and custom dashboards
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 glass min-h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {selectedViz === "network"
              ? "Network Graph Preview"
              : selectedViz === "charts"
              ? "Chart Preview"
              : "Select a visualization type"}
          </CardTitle>
          {selectedViz && (
            <Button variant="outline" size="sm">
              <DownloadIcon className="size-4" />
              Export PDF
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {selectedViz ? (
            <div className="h-[400px] flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
              <p className="text-muted-foreground">
                {selectedViz === "network"
                  ? "Network graph with clustered data nodes — coming soon"
                  : "Chart visualization — coming soon"}
              </p>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-start rounded-lg border border-dashed border-border">
              {showSparkle ? (
                <SparkledBackground
                  position="inline"
                  dotCount={800}
                  reactRadius={100}
                  sphereRadius={80}
                  width={360}
                  height={360}
                  particleColor={sparkleColor}
                  onClick={() => setShowSparkle(false)}
                  className="hover:opacity-80 transition-opacity"
                  globalMouseTracking={true}
                />
              ) : (
                <p className="text-muted-foreground">
                  Click a card above to create a visualization
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
