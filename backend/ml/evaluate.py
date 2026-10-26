"""Rigorous held-out test evaluation module for NeuroGraph AI."""
import json
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve
)

from ml.data_loader import (
    load_oasis_dataset,
    get_subject_stratified_split,
    FEATURE_COLUMNS
)
from ml.preprocess import NeuroGraphPreprocessor
from ml.graph_builder import PatientGraphBuilder
from ml.model import NeuroGraphGAT

def evaluate_model(
    data_dir: Path,
    model_dir: Path
) -> dict:
    data_dir = Path(data_dir)
    model_dir = Path(model_dir)
    
    # Load dataset & subject-split
    df = load_oasis_dataset(data_dir / "oasis_longitudinal.csv")
    train_df, val_df, test_df = get_subject_stratified_split(df, test_size=0.15, val_size=0.15, random_state=42)
    
    # Load preprocessor
    preprocessor = NeuroGraphPreprocessor.load(model_dir / "preprocessor.joblib")
    X_test = preprocessor.transform(test_df)
    y_test = test_df["Target"].values
    
    # Build test graph
    graph_builder = PatientGraphBuilder(k_neighbors=5, rbf_gamma=0.25)
    test_graph = graph_builder.build_graph(X_test, y_test)
    
    # Load model
    model = NeuroGraphGAT(in_channels=X_test.shape[1], hidden_channels=16, num_classes=2, heads=4, dropout=0.2)
    model.load_state_dict(torch.load(model_dir / "gnn_model.pt", map_location="cpu"))
    model.eval()
    
    with torch.no_grad():
        logits = model(test_graph.x, test_graph.edge_index)
        probs = F.softmax(logits, dim=-1)
        preds = logits.argmax(dim=-1).numpy()
        pos_probs = probs[:, 1].numpy()
        
    acc = float(accuracy_score(y_test, preds))
    prec_macro = float(precision_score(y_test, preds, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test, preds, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_test, preds, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_test, preds, average="weighted", zero_division=0))
    f1_macro = float(f1_score(y_test, preds, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y_test, preds, average="weighted", zero_division=0))
    
    try:
        roc_auc = float(roc_auc_score(y_test, pos_probs))
        fpr, tpr, _ = roc_curve(y_test, pos_probs)
        roc_data = {
            "fpr": [round(float(x), 4) for x in fpr],
            "tpr": [round(float(y), 4) for y in tpr]
        }
    except Exception:
        roc_auc = 0.0
        roc_data = None
        
    cm = confusion_matrix(y_test, preds).tolist()
    
    class_dist = {
        "Nondemented": int((y_test == 0).sum()),
        "Demented": int((y_test == 1).sum())
    }
    
    # Read training history if present
    meta_path = model_dir / "metadata.json"
    history = {}
    if meta_path.exists():
        with open(meta_path, "r") as f:
            meta = json.load(f)
            history = meta.get("history", {})
            
    eval_results = {
        "dataset_name": "OASIS-2 Longitudinal MRI",
        "total_samples": len(df),
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec_macro, 4),
            "precision_weighted": round(prec_weighted, 4),
            "recall": round(rec_macro, 4),
            "recall_weighted": round(rec_weighted, 4),
            "f1_score": round(f1_macro, 4),
            "f1_weighted": round(f1_weighted, 4),
            "roc_auc": round(roc_auc, 4)
        },
        "confusion_matrix": {
            "matrix": cm,
            "labels": ["Nondemented", "Demented"],
            "tn": cm[0][0] if len(cm) > 0 else 0,
            "fp": cm[0][1] if len(cm) > 0 and len(cm[0]) > 1 else 0,
            "fn": cm[1][0] if len(cm) > 1 else 0,
            "tp": cm[1][1] if len(cm) > 1 and len(cm[1]) > 1 else 0
        },
        "class_distribution": class_dist,
        "roc_curve": roc_data,
        "training_history": history,
        "is_real_data": True,
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    eval_file = model_dir / "evaluation_results.json"
    with open(eval_file, "w") as f:
        json.dump(eval_results, f, indent=2)
        
    print("Held-out evaluation completed successfully:")
    print(f"Accuracy: {acc:.4f} | Macro F1: {f1_macro:.4f} | Recall: {rec_macro:.4f} | ROC-AUC: {roc_auc:.4f}")
    return eval_results

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent
    evaluate_model(data_dir=base / "data", model_dir=base / "models")
