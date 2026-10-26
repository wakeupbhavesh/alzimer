"""Inductive out-of-sample inference service for incoming patient assessments."""
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import torch
import torch.nn.functional as F

from ml.preprocess import NeuroGraphPreprocessor
from ml.graph_builder import PatientGraphBuilder
from ml.model import NeuroGraphGAT

class NeuroGraphInferenceService:
    def __init__(self, model_dir: Path):
        self.model_dir = Path(model_dir)
        self.preprocessor: NeuroGraphPreprocessor | None = None
        self.graph_builder: PatientGraphBuilder | None = None
        self.model: NeuroGraphGAT | None = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self) -> bool:
        model_path = self.model_dir / "gnn_model.pt"
        prep_path = self.model_dir / "preprocessor.joblib"
        ref_path = self.model_dir / "reference_graph.pt"
        
        if not (model_path.exists() and prep_path.exists() and ref_path.exists()):
            self.is_loaded = False
            return False
            
        try:
            # Load preprocessor
            self.preprocessor = NeuroGraphPreprocessor.load(prep_path)
            
            # Load reference cohort
            ref_data = torch.load(ref_path, map_location="cpu")
            self.graph_builder = PatientGraphBuilder(
                k_neighbors=ref_data.get("k_neighbors", 5),
                rbf_gamma=ref_data.get("rbf_gamma", 0.25)
            )
            self.graph_builder.reference_nodes = ref_data["reference_nodes"]
            self.graph_builder.reference_labels = ref_data["reference_labels"]
            self.graph_builder.reference_metadata = ref_data["reference_metadata"]
            
            # Load PyG GAT model
            in_channels = self.graph_builder.reference_nodes.shape[1]
            self.model = NeuroGraphGAT(
                in_channels=in_channels,
                hidden_channels=16,
                num_classes=2,
                heads=4,
                dropout=0.0
            )
            self.model.load_state_dict(torch.load(model_path, map_location="cpu"))
            self.model.eval()
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"Error loading model artifacts: {e}")
            self.is_loaded = False
            return False

    def predict_patient(self, patient_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run inductive out-of-sample inference on a single patient record.
        """
        if not self.is_loaded or self.model is None or self.preprocessor is None:
            raise RuntimeError("Model is currently unavailable. Trained model checkpoint not found.")
            
        # Standardize and impute single patient input using fitted preprocessor
        x_scaled = self.preprocessor.transform_single(patient_features)
        
        # Build inductive graph linking query patient (node 0) to top-k reference cohort nodes
        query_data, neighbors, graph_payload = self.graph_builder.build_inductive_subgraph(x_scaled)
        
        # Run GNN forward pass on subgraph
        with torch.no_grad():
            logits = self.model(query_data.x, query_data.edge_index)
            probs = F.softmax(logits, dim=-1)
            
            # Extract prediction for the query patient (node 0)
            query_probs = probs[0].cpu().numpy()
            pred_class = int(np.argmax(query_probs))
            
        labels = ["Nondemented", "Demented"]
        pred_label = labels[pred_class]
        confidence = float(query_probs[pred_class])
        
        # Feature summary for clinical comparison against reference cohort medians
        summary = {}
        for col in self.preprocessor.feature_columns:
            val = patient_features.get(col)
            cohort_stats = self.preprocessor.feature_statistics.get(col, {})
            summary[col] = {
                "patient_value": val,
                "cohort_median": cohort_stats.get("median"),
                "cohort_mean": cohort_stats.get("mean")
            }
            
        return {
            "patient_ref_id": patient_features.get("patient_ref_id", "REF-UNKNOWN"),
            "prediction_label": pred_label,
            "confidence": round(confidence, 4),
            "probabilities": {
                "Nondemented": round(float(query_probs[0]), 4),
                "Demented": round(float(query_probs[1]), 4)
            },
            "nearest_neighbors": neighbors,
            "graph_data": graph_payload,
            "feature_summary": summary,
            "model_version": "1.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "This academic research prototype is not a medical diagnostic tool. Predictions are experimental and must not be used to make medical decisions. Consult a qualified healthcare professional for clinical evaluation."
        }
