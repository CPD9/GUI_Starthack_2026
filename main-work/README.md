# Main Work Setup Guide

This folder is now the primary Next.js application root for the StartHack 2026 build.

## Project Layout

- `src/` - app routes, modules, API handlers, and UI components
- `public/` - static assets
- `mcp-server/` - local MCP helper server (optional for core app boot)
- `docs/` - implementation notes and branch plans

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for the Mongo image)
- A `.env` file in `main-work/` based on `.env.example`

## 1) Install and Run App

From repository root:

```bash
cd main-work
cp .env.example .env
npm install
npm run dev
```

App default URL: `http://localhost:3000`

## 2) Environment Variables

Create `.env` in `main-work/` (or copy from `.env.example`) and provide at least:

- `DATABASE_URL` (Neon/Postgres for Drizzle)
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `MONGODB_URI` (defaults to `mongodb://localhost:27017` if omitted)
- other optional integrations as needed (Polar, Stream, OpenAI, etc.)

Never commit `.env` or secret keys.

## 3) MongoDB Test Dataset (Docker)

If you have access to the private GHCR image:

```bash
docker login ghcr.io -u <github-username>
docker pull ghcr.io/svenstamm/txp-mongo:latest
docker run -d -p 27017:27017 --name txp-database ghcr.io/svenstamm/txp-mongo:latest
```

Verify:

```bash
docker ps
docker logs -f txp-database
```

## Apple Silicon (M1/M2/M3/M4) Note

The provided image currently requires AVX and may fail on Apple Silicon even with `--platform linux/amd64`, showing `Illegal instruction`.

If that happens:

- run DB on a Windows/Linux x86 machine (teammate machine) and connect remotely, or
- ask organizers for an ARM-compatible image / hosted DB endpoint.

This is a known environment limitation, not an app code issue.

## 4) Quality Checks Before Push

```bash
npm run lint
```

If DB schema changes were made:

```bash
npm run db:push
```

## Handoff Notes for Kamsy

- Start from branch `feature/dashboard-ui-polish` (contains migrated root app + restored `src`).
- Keep commits focused by feature branch (`feature/<name>`).
- Do not commit local artifacts (`.next`, tar files, `.env`, `.DS_Store`).
