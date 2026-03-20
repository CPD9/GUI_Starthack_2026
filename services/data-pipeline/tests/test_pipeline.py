from pathlib import Path
import sys

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.app import app

client = TestClient(app)


def test_healthcheck():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_clean_and_profile_nodes():
    rows = [
        {"testProgramId": "TestProgram_2", "state": "finishedOK", "value": 10},
        {"testProgramId": "TestProgram_2", "state": "finishedOK", "value": 10},
        {"testProgramId": "TestProgram_3", "state": "failed", "value": None},
    ]
    clean_response = client.post(
        "/pipeline/clean",
        json={"dataset": {"rows": rows}, "params": {"drop_duplicates": True}},
    )
    assert clean_response.status_code == 200
    clean_rows = clean_response.json()["rows"]
    assert len(clean_rows) == 2

    profile_response = client.post(
        "/pipeline/profile",
        json={"dataset": {"rows": clean_rows}, "params": {}},
    )
    assert profile_response.status_code == 200
    body = profile_response.json()
    assert "profile" in body["insights"]
    assert "network" in body["visualizations"]


def test_model_node_clustering():
    rows = [{"a": idx, "b": idx * 2} for idx in range(1, 40)]
    response = client.post(
        "/pipeline/model",
        json={
            "dataset": {"rows": rows},
            "params": {"clusters": 3},
            "problem_type": "auto",
        },
    )
    assert response.status_code == 200
    model_payload = response.json()["insights"]["model"]
    assert model_payload["model_type"] in {"clustering", "regression"}
