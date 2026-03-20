from __future__ import annotations

from typing import Any, Dict

import pandas as pd

from .utils import numeric_columns


def clean_dataset(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
    if df.empty:
        return df

    cleaned = df.copy()
    cleaned.columns = [str(col).strip() for col in cleaned.columns]

    if params.get("drop_duplicates", True):
        cleaned = cleaned.drop_duplicates()

    # Normalize empty strings to null-like values.
    cleaned = cleaned.replace(r"^\s*$", pd.NA, regex=True)

    null_strategy = params.get("null_strategy", "median")
    for column in cleaned.columns:
        if cleaned[column].isna().all():
            continue
        if cleaned[column].dtype.kind in "biufc":
            if null_strategy == "zero":
                cleaned[column] = cleaned[column].fillna(0)
            else:
                cleaned[column] = cleaned[column].fillna(cleaned[column].median())
        else:
            cleaned[column] = cleaned[column].fillna("unknown")

    zscore_limit = float(params.get("zscore_limit", 4.0))
    for col in numeric_columns(cleaned):
        std = cleaned[col].std()
        if std is None or std == 0 or pd.isna(std):
            continue
        mean = cleaned[col].mean()
        zscore = (cleaned[col] - mean) / std
        cleaned = cleaned[zscore.abs() <= zscore_limit]

    return cleaned.reset_index(drop=True)
