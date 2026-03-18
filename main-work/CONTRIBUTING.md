# Development Workflow

## Branching

- `main`: always stable and releasable
- `develop`: integration branch for ongoing work
- `feature/<short-name>`: one change per branch
- `fix/<short-name>`: bug fix branches
- `chore/<short-name>`: tooling and maintenance

## Commit Style

- use small, focused commits
- write clear intent in the first line
- avoid mixed concerns in one commit

Examples:

- `feat(auth): add Clerk session bootstrap`
- `fix(convex): handle missing env values`
- `chore(repo): add MCP server scaffold`

## Code Quality

- keep functions short and single-purpose
- prefer explicit names over abbreviations
- keep side effects isolated
- run checks before pushing

## Pull Request Checklist

- branch is up to date with `develop`
- scope is limited to one change
- local checks pass
- description explains why the change is needed
