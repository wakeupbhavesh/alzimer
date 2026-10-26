"""Application configuration for NeuroGraph AI backend."""
import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "NeuroGraph AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'neurograph.db'}")
    DATASET_PATH: Path = BASE_DIR / "data" / "oasis_longitudinal.csv"
    MODEL_DIR: Path = BASE_DIR / "models"
    MODEL_PATH: Path = BASE_DIR / "models" / "gnn_model.pt"
    PREPROCESSOR_PATH: Path = BASE_DIR / "models" / "preprocessor.joblib"
    REFERENCE_GRAPH_PATH: Path = BASE_DIR / "models" / "reference_graph.pt"
    EVALUATION_PATH: Path = BASE_DIR / "models" / "evaluation_results.json"
    METADATA_PATH: Path = BASE_DIR / "models" / "metadata.json"
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
