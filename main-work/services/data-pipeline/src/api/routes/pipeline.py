from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd
from fastapi import APIRouter

from ...pipeline.cleaning import clean_dataset
from ...pipeline.feature_engineering import enrich_features
from ...pipeline.modeling import run_model
from ...pipeline.normalize import normalize_dataset
from ...pipeline.quality import profile_dataset
from ...pipeline.reshape import concat_datasets, pivot_dataset, split_dataset
from ...pipeline.utils import to_dataframe, to_rows
from ...schemas.pipeline import ModelRequest, PipelineNodeRequest, PipelineNodeResult

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/clean", response_model=PipelineNodeResult)
def clean_node(request: PipelineNodeRequest) -> PipelineNodeResult:
    df = to_dataframe(request.dataset.rows)
    result = clean_dataset(df, request.params)
    return PipelineNodeResult(
        rows=to_rows(result),
        metadata={"operation": "clean", "row_count": len(result)},
    )


@router.post("/normalize", response_model=PipelineNodeResult)
def normalize_node(request: PipelineNodeRequest) -> PipelineNodeResult:
    df = to_dataframe(request.dataset.rows)
    result = normalize_dataset(df, request.params)
    return PipelineNodeResult(
        rows=to_rows(result),
        metadata={"operation": "normalize", "row_count": len(result)},
    )


@router.post("/split", response_model=Dict[str, Any])
def split_node(request: PipelineNodeRequest) -> Dict[str, Any]:
    df = to_dataframe(request.dataset.rows)
    left, right = split_dataset(df, request.params)
    return {
        "left": {"rows": to_rows(left), "row_count": len(left)},
        "right": {"rows": to_rows(right), "row_count": len(right)},
        "metadata": {"operation": "split"},
    }


@router.post("/concat", response_model=PipelineNodeResult)
def concat_node(request: Dict[str, Any]) -> PipelineNodeResult:
    datasets: List[Dict[str, Any]] = request.get("datasets", [])
    params: Dict[str, Any] = request.get("params", {})
    frames = [to_dataframe(item.get("rows", [])) for item in datasets]
    merged = concat_datasets(frames, params)
    return PipelineNodeResult(
        rows=to_rows(merged),
        metadata={"operation": "concat", "row_count": len(merged)},
    )


@router.post("/model", response_model=PipelineNodeResult)
def model_node(request: ModelRequest) -> PipelineNodeResult:
    df = to_dataframe(request.dataset.rows)
    enriched = enrich_features(df, request.params)
    model_output = run_model(
        enriched,
        {
            **request.params,
            "target_column": request.target_column,
            "problem_type": request.problem_type,
        },
    )
    return PipelineNodeResult(
        rows=to_rows(enriched),
        metadata={"operation": "model", "row_count": len(enriched)},
        insights={"model": model_output},
    )


@router.post("/profile", response_model=PipelineNodeResult)
def profile_node(request: PipelineNodeRequest) -> PipelineNodeResult:
    df = to_dataframe(request.dataset.rows)
    profile = profile_dataset(df)
    return PipelineNodeResult(
        rows=to_rows(df),
        metadata={"operation": "profile", "row_count": len(df)},
        insights={"profile": profile},
        visualizations={
            "network": profile.get("network", {}),
            "heatmap": profile.get("correlation_heatmap", {}),
            "pie_candidates": profile.get("distributions", {}),
        },
    )


@router.post("/reshape/pivot", response_model=PipelineNodeResult)
def pivot_node(request: PipelineNodeRequest) -> PipelineNodeResult:
    df = to_dataframe(request.dataset.rows)
    pivoted = pivot_dataset(df, request.params)
    return PipelineNodeResult(
        rows=to_rows(pivoted),
        metadata={"operation": "pivot", "row_count": len(pivoted)},
    )
