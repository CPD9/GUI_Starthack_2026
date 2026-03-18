"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { QueryPlan, QueryResult } from "@/lib/query/types";
import { ChartPreview } from "@/components/dashboard/chart-preview";

type QueryApiSuccess = {
  runId: string;
  sessionId: string;
  persisted: boolean;
  queryPlan: QueryPlan;
  result: QueryResult;
};

type QueryRun = {
  id: string;
  sessionId: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
};

const promptTemplates = [
  "Summarize all available tensile strength properties for steel.",
  "Is there a trend that tensile strength is decreasing over the last 6 months?",
  "How do Machine A and Machine B differ for tensile strength on steel?",
];

const cardStyle: CSSProperties = {
  border: "1px solid #1f2a44",
  borderRadius: 14,
  padding: 18,
  background: "#0d1526",
};

const buttonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #314a7d",
  background: "#1a2f5a",
  color: "#e7edf9",
  cursor: "pointer",
};

const mutedText: CSSProperties = { color: "#b5c0da", margin: 0 };

const statusStyles: Record<QueryRun["status"], CSSProperties> = {
  queued: { background: "#1f2a44", color: "#9db4df" },
  running: { background: "#3d2f10", color: "#f9c874" },
  completed: { background: "#143523", color: "#8be1b4" },
  failed: { background: "#3f1a1a", color: "#ff9d9d" },
};

export default function DashboardPage() {
  const [prompt, setPrompt] = useState(
    "Is there a trend that tensile strength is decreasing over the last 6 months?"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<QueryApiSuccess | null>(null);
  const [history, setHistory] = useState<QueryRun[]>([]);
  const [lastRunDurationMs, setLastRunDurationMs] = useState<number | null>(null);

  const persistedLabel = useMemo(
    () =>
      latest == null ? "No run yet" : latest.persisted ? "Persistence: enabled" : "Persistence: disabled",
    [latest]
  );

  const resultMeta = useMemo(() => {
    if (!latest) {
      return null;
    }

    const chartSeries = latest.result.chart?.series ?? [];
    const pointCount = chartSeries.reduce((sum, serie) => sum + serie.values.length, 0);
    const runCount = history.length;
    return { pointCount, runCount };
  }, [latest, history.length]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/query?limit=10", { method: "GET" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { runs?: QueryRun[] };
      setHistory(payload.runs ?? []);
    } catch {
      // Ignore history fetch errors; dashboard still works for interactive runs.
    }
  }, []);

  const runQuery = async () => {
    const startedAt = Date.now();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          sessionId: latest?.sessionId,
        }),
      });

      const payload = (await response.json()) as QueryApiSuccess & {
        errorMessage?: string;
      };

      if (!response.ok) {
        throw new Error(payload.errorMessage ?? "Query request failed.");
      }

      setLatest(payload);
      setLastRunDurationMs(Date.now() - startedAt);
      await loadHistory();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unexpected request error."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <main
      style={{
        maxWidth: 1240,
        margin: "0 auto",
        padding: "36px 20px 64px",
        display: "grid",
        gap: 18,
      }}
    >
      <header style={cardStyle}>
        <h1 style={{ margin: 0 }}>Analytics dashboard (MVP)</h1>
        <p style={{ ...mutedText, marginTop: 10 }}>
          Ask a question in natural language to test summary, trend, and
          machine-comparison flows.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <span
            style={{
              fontSize: 12,
              borderRadius: 999,
              padding: "4px 10px",
              background: "#1f2a44",
              color: "#9db4df",
            }}
          >
            Intent detection: summary/trend/comparison
          </span>
          <span
            style={{
              fontSize: 12,
              borderRadius: 999,
              padding: "4px 10px",
              background: "#1f2a44",
              color: "#9db4df",
            }}
          >
            {persistedLabel}
          </span>
        </div>
      </header>

      <section style={{ ...cardStyle, display: "grid", gap: 12 }}>
        <label htmlFor="prompt-input" style={{ fontWeight: 600 }}>
          Query prompt
        </label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid #2f3f61",
            background: "#0a1220",
            color: "#e7edf9",
            padding: 12,
            font: "inherit",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {promptTemplates.map((template, index) => (
            <button
              key={template}
              type="button"
              onClick={() => setPrompt(template)}
              title={template}
              style={{
                ...buttonStyle,
                background: "#122341",
                borderColor: "#243d6a",
                fontSize: 13,
                padding: "8px 10px",
              }}
            >
              {`Template ${index + 1}`}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={runQuery}
            disabled={loading || prompt.trim().length < 5}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Running..." : "Run query"}
          </button>
          <span style={{ color: "#9fb2d8" }}>
            {lastRunDurationMs == null ? "No run time yet" : `Last run: ${lastRunDurationMs} ms`}
          </span>
        </div>
        {error ? (
          <p style={{ margin: 0, color: "#ff9d9d" }}>{error}</p>
        ) : null}
      </section>

      {resultMeta ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div style={cardStyle}>
            <p style={{ margin: 0, color: "#8da4d3", fontSize: 12 }}>Detected intent</p>
            <h3 style={{ margin: "8px 0 0", textTransform: "capitalize" }}>
              {latest?.queryPlan.intent}
            </h3>
          </div>
          <div style={cardStyle}>
            <p style={{ margin: 0, color: "#8da4d3", fontSize: 12 }}>Chart data points</p>
            <h3 style={{ margin: "8px 0 0" }}>{resultMeta.pointCount}</h3>
          </div>
          <div style={cardStyle}>
            <p style={{ margin: 0, color: "#8da4d3", fontSize: 12 }}>Runs loaded</p>
            <h3 style={{ margin: "8px 0 0" }}>{resultMeta.runCount}</h3>
          </div>
        </section>
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <article style={{ ...cardStyle, display: "grid", gap: 14 }}>
          <h2 style={{ margin: 0 }}>Latest result</h2>
          {!latest ? (
            <p style={mutedText}>
              No result yet. Submit a prompt to generate a query plan and
              output.
            </p>
          ) : (
            <>
              <p style={{ margin: 0 }}>{latest.result.summary}</p>
              <div style={{ display: "grid", gap: 8 }}>
                <strong>Resolved metric</strong>
                <p style={mutedText}>
                  {latest.result.metric.label}
                  {latest.result.metric.unit ? ` (${latest.result.metric.unit})` : ""}
                  {" · "}
                  <code>{latest.result.metric.id}</code>
                </p>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <strong>How this was computed</strong>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#b5c0da" }}>
                  {latest.result.explanation.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <strong>Plan rationale</strong>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#b5c0da" }}>
                  {latest.queryPlan.rationale.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              {latest.result.chart ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>Chart preview</strong>
                  <ChartPreview chart={latest.result.chart} />
                </div>
              ) : null}
            </>
          )}
        </article>

        <aside style={{ ...cardStyle, display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0 }}>Recent runs</h2>
          {history.length === 0 ? (
            <p style={mutedText}>
              Query history appears once `DATABASE_URL` is configured.
            </p>
          ) : (
            history.map((run) => (
              <div
                key={run.id}
                style={{
                  border: "1px solid #24324f",
                  borderRadius: 8,
                  padding: 10,
                  background: "#0a1220",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span
                    style={{
                      ...statusStyles[run.status],
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 12,
                      padding: "3px 8px",
                      textTransform: "uppercase",
                      letterSpacing: 0.3,
                    }}
                  >
                    {run.status}
                  </span>
                  <span style={{ margin: 0, color: "#8da4d3", fontSize: 12 }}>
                    {new Date(run.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p
                  style={{
                    margin: "8px 0 6px",
                    color: "#b5c0da",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {run.prompt}
                </p>
                <p style={{ margin: 0, color: "#8da4d3", fontSize: 12 }}>{run.id}</p>
              </div>
            ))
          )}
        </aside>
      </section>
    </main>
  );
}
