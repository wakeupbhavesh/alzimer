"""SQLAlchemy models for NeuroGraph AI assessments."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_ref_id = Column(String(64), index=True, nullable=False)
    
    # Core research features (compatible with OASIS GNN)
    age = Column(Float, nullable=False)
    sex = Column(String(8), nullable=False)  # 'M' or 'F'
    education_years = Column(Float, nullable=False)
    ses = Column(Float, nullable=True)  # Socioeconomic status (1-5)
    mmse_score = Column(Float, nullable=True)  # Mini-Mental State Examination (0-30)
    etiv = Column(Float, nullable=False)  # Estimated Total Intracranial Volume
    nwbv = Column(Float, nullable=False)  # Normalized Whole Brain Volume
    asf = Column(Float, nullable=False)  # Atlas Scaling Factor
    
    # Extended research fields (stored as JSON)
    optional_clinical_info = Column(Text, nullable=True)
    
    # Model inference results
    prediction_label = Column(String(32), nullable=False)
    prediction_probability = Column(Float, nullable=False)
    class_probabilities = Column(Text, nullable=False)  # JSON dictionary
    nearest_neighbors = Column(Text, nullable=False)  # JSON graph neighborhood
    model_version = Column(String(32), nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
