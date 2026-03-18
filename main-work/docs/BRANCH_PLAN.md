# Branch Plan

## Core model

- `main`: always demo-ready
- `develop`: integration branch for completed feature branches
- `feature/*`: one focused unit of work each

## Branch sequence

1. `feature/auth-screens`
2. `feature/db-schema`
3. `feature/core-layout`
4. `feature/data-ingestion`
5. `feature/query-planner`
6. `feature/analytics-engine`
7. `feature/chart-output`
8. `feature/chat-orchestration`
9. `feature/history-reuse`
10. `feature/polish-demo`

## Merge rules

- Always branch from `develop`
- Keep each branch small and shippable
- Open PR/merge into `develop` after checks pass
- Merge `develop` into `main` only at stable milestones

## Commit style

- `feat(auth): add Better Auth sign-in screen`
- `feat(billing): add Polar checkout session flow`
- `feat(schema): add test-series and measurements tables`
- `fix(analytics): handle missing timestamp window`
- `chore(ui): tighten spacing on result cards`
