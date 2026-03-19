from __future__ import annotations

from typing import Any, Dict

import pandas as pd

from .utils import numeric_columns


def normalize_dataset(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
    if df.empty:
        return df

    normalized = df.copy()
    mode = params.get("mode", "zscore")
    cols = params.get("columns") or numeric_columns(normalized)

    for col in cols:
        if col not in normalized.columns:
            continue
        series = pd.to_numeric(normalized[col], errors="coerce")
        if series.isna().all():
            continue
        if mode == "minmax":
            min_val = series.min()
            max_val = series.max()
            if max_val == min_val:
                normalized[col] = 0.0
            else:
                normalized[col] = (series - min_val) / (max_val - min_val)
        else:
            mean_val = series.mean()
            std_val = series.std()
            normalized[col] = 0.0 if std_val == 0 else (series - mean_val) / std_val

    unit_overrides = params.get("unit_overrides", {})
    if unit_overrides and "unit" in normalized.columns:
        normalized["unit"] = normalized["unit"].replace(unit_overrides)

    return normalized.reset_index(drop=True)
