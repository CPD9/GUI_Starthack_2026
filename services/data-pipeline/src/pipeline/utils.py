from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd


def to_dataframe(rows: List[Dict[str, Any]]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)


def to_rows(df: pd.DataFrame) -> List[Dict[str, Any]]:
    if df.empty:
        return []
    return df.where(pd.notna(df), None).to_dict(orient="records")


def numeric_columns(df: pd.DataFrame) -> List[str]:
    if df.empty:
        return []
    return df.select_dtypes(include=["number", "bool"]).columns.tolist()
