"""Pydantic schemas for data validation and API payloads in NeuroGraph AI."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator

class PatientAssessmentInput(BaseModel):
    patient_ref_id: str = Field(..., description="Pseudonymous research patient identifier", min_length=2, max_length=64)
    
    # Core clinical & imaging variables supported by OASIS-2 GNN model
    age: float = Field(..., ge=45.0, le=105.0, description="Age in years (45 - 105)")
    sex: str = Field(..., description="Biological sex ('M' or 'F')")
    education_years: float = Field(..., ge=1.0, le=28.0, description="Years of formal education (1 - 28)")
    ses: Optional[float] = Field(None, ge=1.0, le=5.0, description="Socioeconomic status (Hollingshead Index 1-5)")
    mmse_score: Optional[float] = Field(None, ge=0.0, le=30.0, description="Mini-Mental State Examination score (0 - 30)")
    etiv: float = Field(..., ge=900.0, le=2400.0, description="Estimated Total Intracranial Volume in mm^3")
    nwbv: float = Field(..., ge=0.55, le=0.90, description="Normalized Whole Brain Volume (ratio 0.55 - 0.90)")
    asf: float = Field(..., ge=0.70, le=1.80, description="Atlas Scaling Factor (ratio 0.70 - 1.80)")
    
    # Optional clinical research telemetry
    family_history: Optional[str] = Field(None, description="Family history of dementia or neurodegenerative disorders")
    hypertension_history: Optional[str] = Field(None, description="Documented history of hypertension")
    diabetes_history: Optional[str] = Field(None, description="Documented history of diabetes")
    smoking_status: Optional[str] = Field(None, description="Current or past smoking status")
    physical_activity: Optional[str] = Field(None, description="Weekly physical activity level")
    moca_score: Optional[float] = Field(None, ge=0.0, le=30.0, description="Montreal Cognitive Assessment score")
    clinical_dementia_rating: Optional[float] = Field(None, ge=0.0, le=3.0, description="Clinical Dementia Rating (Research reference only)")
    memory_assessment_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Normalized memory assessment battery score")
    apoe_e4_status: Optional[str] = Field(None, description="APOE epsilon-4 allele carrier status")

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if v_upper not in ("M", "F", "MALE", "FEMALE"):
            raise ValueError("Sex must be 'M' or 'F'")
        return "M" if v_upper in ("M", "MALE") else "F"

class NeighborNode(BaseModel):
    id: str
    similarity: float
    diagnosis: str
    age: float
    mmse: Optional[float]
    nwbv: float
    label: str

class GraphDataPayload(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    patient_ref_id: str
    prediction_label: str  # 'Nondemented' or 'Demented'
    confidence: float
    probabilities: dict[str, float]
    nearest_neighbors: list[NeighborNode] = []
    graph_data: GraphDataPayload
    feature_summary: dict[str, Any]
    model_version: str
    timestamp: str
    disclaimer: str

class HealthResponse(BaseModel):
    status: str
    model_available: bool
    dataset_available: bool
    model_version: Optional[str] = None
    environment: str

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    architecture: str
    dataset: str
    supported_features: list[str]
    target_classes: list[str]
    is_trained: bool
    last_trained_timestamp: Optional[str] = None
    graph_construction: dict[str, Any]
    limitations: list[str]

class EvaluationResponse(BaseModel):
    dataset_name: str
    total_samples: int
    train_samples: int
    val_samples: int
    test_samples: int
    metrics: dict[str, float]
    confusion_matrix: dict[str, Any]
    class_distribution: dict[str, int]
    roc_curve: Optional[dict[str, list[float]]] = None
    training_history: Optional[dict[str, list[float]]] = None
    is_real_data: bool
    evaluation_timestamp: str

class AssessmentSummary(BaseModel):
    id: int
    patient_ref_id: str
    age: float
    sex: str
    education_years: float
    ses: Optional[float]
    mmse_score: Optional[float]
    etiv: float
    nwbv: float
    asf: float
    prediction_label: str
    prediction_probability: float
    model_version: str
    created_at: datetime
