"""FastAPI endpoints for NeuroGraph AI prediction, evaluation, and assessment tracking."""
import json
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Assessment
from app.schemas import (
    PatientAssessmentInput,
    PredictionResponse,
    HealthResponse,
    ModelInfoResponse,
    EvaluationResponse,
    AssessmentSummary
)
from ml.predict import NeuroGraphInferenceService

router = APIRouter()
inference_service = NeuroGraphInferenceService(settings.MODEL_DIR)

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Return backend health, dataset status, and GNN model availability."""
    model_loaded = inference_service.is_loaded or inference_service.load_artifacts()
    dataset_exists = settings.DATASET_PATH.exists() and settings.DATASET_PATH.stat().st_size > 0
    
    return HealthResponse(
        status="healthy",
        model_available=model_loaded,
        dataset_available=dataset_exists,
        model_version=settings.VERSION if model_loaded else None,
        environment=settings.ENVIRONMENT
    )

@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    """Return architecture details, supported features, and training status."""
    meta_path = settings.METADATA_PATH
    if meta_path.exists():
        with open(meta_path, "r") as f:
            meta = json.load(f)
    else:
        meta = {}
        
    is_trained = inference_service.is_loaded or inference_service.load_artifacts()
    
    return ModelInfoResponse(
        model_name=meta.get("model_name", "NeuroGraph GAT"),
        model_version=meta.get("model_version", settings.VERSION),
        architecture=meta.get("architecture", "Graph Attention Network (PyTorch Geometric)"),
        dataset=meta.get("dataset", "OASIS-2 Longitudinal MRI Dataset"),
        supported_features=meta.get("supported_features", [
            "Age", "M/F", "EDUC", "SES", "MMSE", "eTIV", "nWBV", "ASF"
        ]),
        target_classes=meta.get("target_classes", ["Nondemented", "Demented"]),
        is_trained=is_trained,
        last_trained_timestamp=meta.get("last_trained_timestamp"),
        graph_construction={
            "type": "Patient-Similarity Graph (PSG)",
            "method": "k-Nearest Neighbors with Gaussian RBF similarity weights",
            "k_neighbors": 5,
            "inference": "Inductive query subgraph embedding"
        },
        limitations=[
            "Academic research prototype only - not certified for clinical diagnostic use.",
            "Features restricted to OASIS-2 longitudinal MRI cohort parameters.",
            "CDR was held-out during training to avoid trivial target leakage.",
            "Missing values in SES/MMSE are imputed using training cohort medians."
        ]
    )

@router.get("/evaluation", response_model=EvaluationResponse)
def get_evaluation():
    """Return authentic held-out test evaluation results when available."""
    eval_path = settings.EVALUATION_PATH
    if not eval_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation results unavailable. The GNN model has not yet completed training and evaluation."
        )
        
    try:
        with open(eval_path, "r") as f:
            data = json.load(f)
        return EvaluationResponse(**data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read evaluation results: {str(e)}"
        )

@router.post("/predict", response_model=PredictionResponse)
def predict_patient(
    patient: PatientAssessmentInput,
    db: Session = Depends(get_db)
):
    """
    Validate patient input, construct inductive graph representation,
    and run GNN inference using trained checkpoint.
    """
    if not inference_service.is_loaded:
        loaded = inference_service.load_artifacts()
        if not loaded:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Trained GNN model checkpoint is unavailable. Please run training pipeline first."
            )
            
    # Prepare feature dict matching trained OASIS features
    feature_dict = {
        "patient_ref_id": patient.patient_ref_id,
        "Age": patient.age,
        "M/F": patient.sex,
        "EDUC": patient.education_years,
        "SES": patient.ses,
        "MMSE": patient.mmse_score,
        "eTIV": patient.etiv,
        "nWBV": patient.nwbv,
        "ASF": patient.asf
    }
    
    try:
        result = inference_service.predict_patient(feature_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during graph convolution: {str(e)}"
        )
        
    # Store optional fields as JSON in DB record
    optional_fields = {
        "family_history": patient.family_history,
        "hypertension_history": patient.hypertension_history,
        "diabetes_history": patient.diabetes_history,
        "smoking_status": patient.smoking_status,
        "physical_activity": patient.physical_activity,
        "moca_score": patient.moca_score,
        "clinical_dementia_rating": patient.clinical_dementia_rating,
        "memory_assessment_score": patient.memory_assessment_score,
        "apoe_e4_status": patient.apoe_e4_status
    }
    
    # Persist assessment record into SQLite
    db_assessment = Assessment(
        patient_ref_id=patient.patient_ref_id,
        age=patient.age,
        sex=patient.sex,
        education_years=patient.education_years,
        ses=patient.ses,
        mmse_score=patient.mmse_score,
        etiv=patient.etiv,
        nwbv=patient.nwbv,
        asf=patient.asf,
        optional_clinical_info=json.dumps(optional_fields),
        prediction_label=result["prediction_label"],
        prediction_probability=result["confidence"],
        class_probabilities=json.dumps(result["probabilities"]),
        nearest_neighbors=json.dumps(result["nearest_neighbors"]),
        model_version=result["model_version"]
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    
    result["id"] = db_assessment.id
    return result

@router.get("/assessments", response_model=List[AssessmentSummary])
def get_assessments(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Return historical patient assessment records with pseudonymous identifiers."""
    records = db.query(Assessment).order_by(Assessment.created_at.desc()).offset(offset).limit(limit).all()
    return records

@router.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """Delete an authorized assessment record by ID."""
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment record #{assessment_id} not found."
        )
    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Assessment #{assessment_id} deleted successfully."}
