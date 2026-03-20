from __future__ import annotations

from typing import Any, Dict

import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from .utils import numeric_columns


def run_model(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    if df.empty:
        return {
            "model_type": "none",
            "metrics": {},
            "predictions": [],
            "feature_importance": {},
            "error": "Dataset is empty.",
        }

    target = params.get("target_column")
    if target and target in df.columns:
        return run_regression(df, target, params)
    return run_clustering(df, params)


def run_regression(df: pd.DataFrame, target: str, params: Dict[str, Any]) -> Dict[str, Any]:
    features = [col for col in numeric_columns(df) if col != target]
    if not features:
        return {
            "model_type": "regression",
            "metrics": {},
            "predictions": [],
            "feature_importance": {},
            "error": "No numeric feature columns found for modeling.",
        }

    work = df[features + [target]].dropna()
    if len(work) < 12:
        return {
            "model_type": "regression",
            "metrics": {},
            "predictions": [],
            "feature_importance": {},
            "error": "Not enough rows after dropping nulls.",
        }

    x_train, x_test, y_train, y_test = train_test_split(
        work[features], work[target], test_size=0.2, random_state=42
    )
    model = RandomForestRegressor(
        n_estimators=int(params.get("trees", 100)),
        random_state=42,
    )
    model.fit(x_train, y_train)
    preds = model.predict(x_test)

    return {
        "model_type": "regression",
        "metrics": {
            "r2": float(round(r2_score(y_test, preds), 4)),
            "rmse": float(round(mean_squared_error(y_test, preds) ** 0.5, 4)),
        },
        "predictions": [float(round(value, 6)) for value in preds[:200]],
        "feature_importance": {
            col: float(round(score, 6))
            for col, score in sorted(
                zip(features, model.feature_importances_), key=lambda item: item[1], reverse=True
            )
        },
        "error": None,
    }


def run_clustering(df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
    cols = numeric_columns(df)
    if not cols:
        return {
            "model_type": "clustering",
            "metrics": {},
            "predictions": [],
            "feature_importance": {},
            "error": "No numeric columns available for clustering.",
        }

    work = df[cols].dropna()
    if len(work) < 8:
        return {
            "model_type": "clustering",
            "metrics": {},
            "predictions": [],
            "feature_importance": {},
            "error": "Not enough rows for clustering.",
        }

    clusters = min(max(int(params.get("clusters", 3)), 2), 8)
    model = KMeans(n_clusters=clusters, random_state=42, n_init="auto")
    labels = model.fit_predict(work)

    counts = pd.Series(labels).value_counts().sort_index().to_dict()
    return {
        "model_type": "clustering",
        "metrics": {"clusters": clusters, "inertia": float(round(model.inertia_, 4))},
        "predictions": [int(label) for label in labels[:200]],
        "feature_importance": {},
        "cluster_distribution": {str(key): int(value) for key, value in counts.items()},
        "error": None,
    }
