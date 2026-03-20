# Incremental Import Map

Use this as the execution order for pulling architecture patterns into the current project.

## Batch 1 - App shell and layout

- `web/src/app/layout.tsx`
- `web/src/app/page.tsx`
- `web/src/app/globals.css`
- `web/src/components/ui/*` (base UI only)

Goal: get a stable shell with consistent spacing and reusable UI primitives.

## Batch 2 - Auth and billing baseline

- `web/src/lib/env.ts`
- `web/src/lib/auth.ts`
- `web/src/lib/auth-client.ts`
- `web/src/app/api/auth/[...all]/route.ts`
- `web/src/app/(auth)/*` (sign-in, sign-up, reset flow)
- `web/src/app/(billing)/*` (upgrade, success, portal)

Goal: login flow and Polar checkout entry point.

## Batch 3 - Data model and state tracking

- `web/convex/schema.ts`
- `web/convex/queryRuns.ts`
- `web/convex/querySessions.ts`
- `web/convex/datasets.ts`

Goal: project-level status tracking with real-time updates.

## Batch 4 - Query orchestration

- `web/src/app/actions/query.ts`
- `web/src/app/api/query/route.ts`
- `web/src/lib/query/intent.ts`
- `web/src/lib/query/planner.ts`
- `web/src/lib/query/executor.ts`

Goal: convert natural-language prompts into structured data operations.

## Batch 5 - Results and transparency views

- `web/src/components/results/status-card.tsx`
- `web/src/components/results/flow.tsx`
- `web/src/components/results/tab-content.tsx`
- `web/src/components/results/charts/*`
- `web/src/components/results/explanation.tsx`

Goal: answer, chart, and explainability in one consistent result surface.

## Batch 6 - Reuse and productivity

- `web/src/components/history/*`
- `web/src/app/dashboard/history/page.tsx`
- `web/src/lib/templates/*`

Goal: recent queries, rerun, and saved templates.

## Rules while importing

- Keep each batch in its own feature branch.
- Run typecheck and lint before each merge.
- Rename domain terms to materials-testing terms immediately.
- Do not merge partially wired files into `develop`.
