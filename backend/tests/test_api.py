"""Integration tests for FastAPI endpoints."""
from fastapi.testclient import TestClient
import pytest
from app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_available"] is True
    assert data["dataset_available"] is True

def test_api_model_info(client):
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["is_trained"] is True
    assert "Age" in data["supported_features"]
    assert "MMSE" in data["supported_features"]
    assert "CDR" not in data["supported_features"]  # Ensure no CDR target leakage

def test_api_evaluation(client):
    response = client.get("/api/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "accuracy" in data["metrics"]
    assert data["is_real_data"] is True
    assert data["metrics"]["accuracy"] > 0.60

def test_api_predict_success(client):
    payload = {
        "patient_ref_id": "TEST-PAT-001",
        "age": 78.0,
        "sex": "M",
        "education_years": 16.0,
        "ses": 2.0,
        "mmse_score": 24.0,
        "etiv": 1650.0,
        "nwbv": 0.71,
        "asf": 1.05,
        "family_history": "Maternal dementia",
        "hypertension_history": "Stage 1 treated"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["patient_ref_id"] == "TEST-PAT-001"
    assert data["prediction_label"] in ("Nondemented", "Demented")
    assert "probabilities" in data
    assert "graph_data" in data
    assert len(data["graph_data"]["nodes"]) > 0
    assert "disclaimer" in data

def test_api_predict_validation_error(client):
    # Invalid age and missing required fields
    invalid_payload = {
        "patient_ref_id": "X",
        "age": 25.0,  # Below min 45
        "sex": "INVALID_SEX"
    }
    response = client.post("/api/predict", json=invalid_payload)
    assert response.status_code == 422  # Unprocessable Entity
