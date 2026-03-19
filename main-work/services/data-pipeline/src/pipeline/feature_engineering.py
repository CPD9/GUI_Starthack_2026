from __future__ import annotations

from typing import Any, Dict

import pandas as pd

from .utils import numeric_columns


def enrich_features(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
    if df.empty:
        return df

    enriched = df.copy()
    ts_col = params.get("timestamp_column", "modifiedOn")
    if ts_col in enriched.columns:
        parsed = pd.to_datetime(enriched[ts_col], errors="coerce")
        enriched[f"{ts_col}_year"] = parsed.dt.year
        enriched[f"{ts_col}_month"] = parsed.dt.month
        enriched[f"{ts_col}_weekday"] = parsed.dt.dayofweek

    for col in numeric_columns(enriched):
        roll_window = int(params.get("rolling_window", 3))
        if roll_window > 1:
            enriched[f"{col}_rolling_mean"] = (
                pd.to_numeric(enriched[col], errors="coerce")
                .rolling(window=roll_window, min_periods=1)
                .mean()
            )

    return enriched.reset_index(drop=True)
