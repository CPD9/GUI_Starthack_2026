from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
import pandas as pd

from .utils import numeric_columns


def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {
            "row_count": 0,
            "column_count": 0,
            "columns": [],
            "missing_ratio": {},
            "distributions": {},
            "correlation_heatmap": {"x": [], "y": [], "z": []},
            "network": {"nodes": [], "edges": []},
        }

    missing_ratio = {
        col: float(round(df[col].isna().mean(), 4))
        for col in df.columns
    }

    distributions = {}
    for col in df.columns[:15]:
        top = (
            df[col]
            .astype(str)
            .value_counts(dropna=False)
            .head(8)
            .to_dict()
        )
        distributions[col] = top

    num_cols = numeric_columns(df)
    corr = (
        df[num_cols]
        .corr(numeric_only=True)
        .replace([np.inf, -np.inf], np.nan)
        .fillna(0.0)
        if num_cols
        else pd.DataFrame()
    )
    heatmap = {
        "x": corr.columns.tolist(),
        "y": corr.index.tolist(),
        "z": corr.values.round(4).tolist(),
    }

    network = build_network_summary(df)

    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "columns": [str(col) for col in df.columns],
        "missing_ratio": missing_ratio,
        "distributions": distributions,
        "correlation_heatmap": heatmap,
        "network": network,
    }


def build_network_summary(df: pd.DataFrame) -> Dict[str, Any]:
    columns = [col for col in ["testProgramId", "state", "name"] if col in df.columns]
    if len(columns) < 2:
        columns = _fallback_network_columns(df)
    if not columns:
        return {"nodes": [], "edges": []}

    subset = df[columns].astype(str).fillna("unknown")
    nodes: Dict[str, Dict[str, Any]] = {}
    edge_weights: Dict[tuple[str, str], int] = {}

    for _, row in subset.iterrows():
        values: List[str] = []
        for col in columns:
            node_id = f"{col}:{row[col]}"
            values.append(node_id)
            if node_id not in nodes:
                nodes[node_id] = {"id": node_id, "label": row[col], "group": col, "value": 0}
            nodes[node_id]["value"] += 1

        for idx, source in enumerate(values):
            for target in values[idx + 1 :]:
                key = tuple(sorted((source, target)))
                edge_weights[key] = edge_weights.get(key, 0) + 1

    edges = [
        {"source": src, "target": dst, "weight": weight}
        for (src, dst), weight in sorted(edge_weights.items(), key=lambda item: item[1], reverse=True)[:200]
    ]

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }


def _fallback_network_columns(df: pd.DataFrame) -> List[str]:
    candidates: List[str] = []
    for col in df.columns:
        series = df[col]
        if series.dtype.kind in "biufc":
            continue
        unique_count = series.astype(str).nunique(dropna=True)
        if 2 <= unique_count <= 30:
            candidates.append(str(col))
        if len(candidates) >= 3:
            break
    return candidates if len(candidates) >= 2 else []
