from __future__ import annotations

from typing import Any, Dict, List, Tuple

import pandas as pd


def split_dataset(df: pd.DataFrame, params: Dict[str, Any]) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if df.empty:
        return df, pd.DataFrame()

    ratio = float(params.get("ratio", 0.8))
    ratio = min(max(ratio, 0.1), 0.9)
    idx = int(len(df) * ratio)
    left = df.iloc[:idx].reset_index(drop=True)
    right = df.iloc[idx:].reset_index(drop=True)
    return left, right


def concat_datasets(datasets: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
    axis = int(params.get("axis", 0))
    ignore_index = bool(params.get("ignore_index", True))
    valid = [frame for frame in datasets if not frame.empty]
    if not valid:
        return pd.DataFrame()
    return pd.concat(valid, axis=axis, ignore_index=ignore_index)


def pivot_dataset(df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
    if df.empty:
        return df
    index = params.get("index")
    columns = params.get("columns")
    values = params.get("values")
    aggfunc = params.get("aggfunc", "mean")
    if not index or not columns or not values:
        return df
    return (
        pd.pivot_table(df, index=index, columns=columns, values=values, aggfunc=aggfunc)
        .reset_index()
        .fillna(0)
    )
