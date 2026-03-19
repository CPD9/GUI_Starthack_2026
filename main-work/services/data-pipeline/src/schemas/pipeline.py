from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DatasetPayload(BaseModel):
    rows: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PipelineNodeRequest(BaseModel):
    dataset: DatasetPayload
    params: Dict[str, Any] = Field(default_factory=dict)


class PipelineNodeResult(BaseModel):
    rows: List[Dict[str, Any]]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    insights: Dict[str, Any] = Field(default_factory=dict)
    visualizations: Dict[str, Any] = Field(default_factory=dict)
    errors: List[str] = Field(default_factory=list)


class ModelRequest(PipelineNodeRequest):
    target_column: Optional[str] = None
    problem_type: str = "auto"
