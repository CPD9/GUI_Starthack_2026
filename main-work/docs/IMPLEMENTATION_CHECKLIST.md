# Implementation Checklist

This checklist maps incremental implementation work for the materials analytics assistant.

## Stage 0 - Foundation

- [ ] Verify repo root and ignore rules
- [ ] Confirm web app runs (`web`) and MCP server runs (`mcp-server`)
- [ ] Add `.env.example` files for both projects
- [ ] Add typed config module for required env vars

## Stage 1 - Auth and shell UI (`feature/auth-screens`)

- [ ] Add Better Auth server and client wiring in Next.js app
- [ ] Add Polar checkout and portal integration baseline
- [ ] Add signed-out, sign-in, and sign-up screens
- [ ] Add web app shell: chat panel, answer panel, chart panel, history panel

## Stage 2 - Data schema (`feature/db-schema`)

- [ ] Create Convex tables for:
  - `datasets`
  - `querySessions`
  - `queryRuns`
  - `analysisArtifacts`
- [ ] Add indexes for user, status, createdAt
- [ ] Add status enums (`queued`, `running`, `completed`, `failed`)

## Stage 3 - Data ingestion (`feature/data-ingestion`)

- [ ] Add dataset registration flow
- [ ] Save source metadata (collection, machine, material, date range)
- [ ] Add ingestion validation checks (required fields, date consistency)

## Stage 4 - Query planner (`feature/query-planner`)

- [ ] Build intent classifier for:
  - summarization/reporting
  - trend/drift analysis
  - cross-machine/site comparison
- [ ] Build filter extractor (material, property, time window, machine/site)
- [ ] Persist structured query plan in `queryRuns`

## Stage 5 - Analytics engine (`feature/analytics-engine`)

- [ ] Implement aggregation runner for summary queries
- [ ] Implement trend calculations (rolling mean, slope, outlier flags)
- [ ] Implement comparison mode (A vs B distributions + significance check)
- [ ] Save intermediate outputs for transparency

## Stage 6 - Chart output (`feature/chart-output`)

- [ ] Return chart spec payload with every completed run
- [ ] Support line chart (trend), bar chart (summary), box/violin chart (comparison)
- [ ] Add chart fallback state if data is insufficient

## Stage 7 - Chat orchestration (`feature/chat-orchestration`)

- [ ] Add ask/answer flow with progress states
- [ ] Connect chat messages to query runs
- [ ] Attach "How this was computed" section to each answer

## Stage 8 - History and reuse (`feature/history-reuse`)

- [ ] Recent queries list
- [ ] Re-run with same filters
- [ ] Save query templates

## Stage 9 - Demo polish (`feature/polish-demo`)

- [ ] Demo dataset presets
- [ ] Error handling and empty states
- [ ] Performance pass for slow queries
- [ ] Scripted demo path for judges

## Definition of done per stage

- [ ] branch has focused commits
- [ ] typecheck passes
- [ ] no obvious lint errors
- [ ] demoable from app UI
