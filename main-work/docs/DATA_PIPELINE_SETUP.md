# Data Pipeline Setup

Use this guide for local CSV exploration and pipeline work.

## Where to place CSV files

Put source exports here:

- `main-work/data/raw/`

Do not commit raw files to Git. This folder is intentionally ignored.

## Processed output location

Write transformed outputs here:

- `main-work/data/processed/`

Optional profiling reports:

- `main-work/data/reports/`

## Suggested initial CSV files

- `tests.csv` (run-level rows from `test` collection)
- `translations.csv` (UUID -> human label)
- `unittables.csv` (unit metadata)
- `valuecolumns_migrated_sample.csv` (sampled subset first, not full 45k arrays)

## Python service runtime (separate process)

Start the pipeline service:

```bash
cd main-work/services/data-pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.app:app --reload --port 8100
```

Then run the app in a second terminal:

```bash
cd main-work
npm run dev
```

The app calls the pipeline service via `PIPELINE_SERVICE_URL`.

## Next API bridge routes

- `POST /api/pipeline/upload` - stores CSV in `data/raw/`
- `POST /api/pipeline` - executes pipeline action through Python service
- `POST /api/automation` - queues automation trigger
- `POST /api/reports` - generates downloadable PDF

## End-to-end demo checklist (CSV -> PDF)

1. Start `uvicorn src.app:app --reload --port 8100` in `services/data-pipeline`.
2. Start `npm run dev` in `main-work`.
3. Open `/visualizations`, upload a CSV, then run:
   - `Clean`
   - `Normalize`
   - `Run Profile`
   - `Model`
4. Confirm network/pie/heatmap render with returned payloads.
5. Open `/workflow-agents` and click `Add Automation`.
6. Return to `/visualizations` and click `Export PDF`.
7. Verify a PDF is downloaded and includes summary + chart notes.

## Verification commands used

```bash
# Next.js production gate
cd main-work
npm run build

# Targeted lint gate for new modules
npx eslint "src/modules/visualizations/ui/visualizations-view.tsx" \
  "src/modules/workflow-agents/ui/workflow-agents-view.tsx" \
  "src/app/api/pipeline/route.ts" \
  "src/app/api/pipeline/upload/route.ts" \
  "src/app/api/automation/route.ts" \
  "src/app/api/reports/route.ts"

# Python service unit + contract checks
cd services/data-pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

## Branch workflow

1. Start from latest `main`.
2. Create/checkout `feature/data-pipeline-csv`.
3. Build extraction + normalization scripts.
4. Commit only code/docs, never raw data.

## Quick check before commit

From repo root:

```bash
git status
```

You should **not** see files inside `main-work/data/raw/`.
