"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { QueryPlan, QueryResult } from "@/lib/query/types";

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

export default function DashboardPage() {
  const [prompt, setPrompt] = useState(
    "Is there a trend that tensile strength is decreasing over the last 6 months?"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<QueryApiSuccess | null>(null);
  const [history, setHistory] = useState<QueryRun[]>([]);

  const persistedLabel = useMemo(
    () =>
      latest == null ? "No run yet" : latest.persisted ? "Persistence: enabled" : "Persistence: disabled",
    [latest]
  );

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
        <p style={{ marginBottom: 0, color: "#b5c0da" }}>
          Ask a question in natural language to test summary, trend, and
          machine-comparison flows.
        </p>
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
          <span style={{ color: "#9fb2d8" }}>{persistedLabel}</span>
        </div>
        {error ? (
          <p style={{ margin: 0, color: "#ff9d9d" }}>{error}</p>
        ) : null}
      </section>

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
            <p style={{ margin: 0, color: "#b5c0da" }}>
              No result yet. Submit a prompt to generate a query plan and
              output.
            </p>
          ) : (
            <>
              <p style={{ margin: 0 }}>{latest.result.summary}</p>
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
                <div style={{ display: "grid", gap: 6 }}>
                  <strong>Chart payload preview</strong>
                  <pre
                    style={{
                      margin: 0,
                      padding: 12,
                      background: "#09101c",
                      border: "1px solid #24324f",
                      borderRadius: 8,
                      overflowX: "auto",
                      color: "#cfe0ff",
                    }}
                  >
                    {JSON.stringify(latest.result.chart, null, 2)}
                  </pre>
                </div>
              ) : null}
            </>
          )}
        </article>

        <aside style={{ ...cardStyle, display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0 }}>Recent runs</h2>
          {history.length === 0 ? (
            <p style={{ margin: 0, color: "#b5c0da" }}>
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
                <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{run.status}</p>
                <p
                  style={{
                    margin: "0 0 6px",
                    color: "#b5c0da",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {run.prompt}
                </p>
                <p style={{ margin: 0, color: "#8da4d3", fontSize: 12 }}>
                  {new Date(run.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </aside>
      </section>
    </main>
  );
}
