# Data Pipeline Service

FastAPI service for reusable data-pipeline nodes used by the Next.js app.

## Features

- Cleaning, normalization, split, concat, profiling, and modeling endpoints.
- Node-style JSON contracts so each operation can be used in workflow builders.
- Output payloads include chart-ready structures for heatmaps, pie charts, and networks.

## Local Run

```bash
cd services/data-pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.app:app --reload --port 8100
```

Health check:

```bash
curl http://localhost:8100/health
```

## Tests

```bash
pytest -q
```
