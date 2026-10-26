"""Reproducible training pipeline for NeuroGraph AI GAT model."""
import json
import random
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from sklearn.utils.class_weight import compute_class_weight

from ml.data_loader import (
    download_dataset_if_needed,
    load_oasis_dataset,
    get_subject_stratified_split,
    FEATURE_COLUMNS
)
from ml.preprocess import NeuroGraphPreprocessor
from ml.graph_builder import PatientGraphBuilder
from ml.model import NeuroGraphGAT

def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def train_model(
    data_dir: Path,
    model_dir: Path,
    epochs: int = 150,
    lr: float = 0.005,
    weight_decay: float = 1e-4,
    patience: int = 25,
    seed: int = 42
):
    set_seed(seed)
    data_dir = Path(data_dir)
    model_dir = Path(model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    
    csv_path = data_dir / "oasis_longitudinal.csv"
    download_dataset_if_needed(csv_path)
    df = load_oasis_dataset(csv_path)
    
    print(f"Loaded OASIS dataset: {len(df)} records across {df['Subject ID'].nunique()} subjects.")
    
    # Subject-stratified split to prevent data leakage
    train_df, val_df, test_df = get_subject_stratified_split(df, test_size=0.15, val_size=0.15, random_state=seed)
    print(f"Split sizes - Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
    
    # Fit preprocessor strictly on training data
    preprocessor = NeuroGraphPreprocessor()
    preprocessor.fit(train_df)
    preprocessor.save(model_dir / "preprocessor.joblib")
    
    X_train = preprocessor.transform(train_df)
    y_train = train_df["Target"].values
    
    X_val = preprocessor.transform(val_df)
    y_val = val_df["Target"].values
    
    X_test = preprocessor.transform(test_df)
    y_test = test_df["Target"].values
    
    # Build Patient-Similarity Graphs for train and val
    graph_builder = PatientGraphBuilder(k_neighbors=5, rbf_gamma=0.25)
    train_graph = graph_builder.build_graph(X_train, y_train)
    val_graph = graph_builder.build_graph(X_val, y_val)
    test_graph = graph_builder.build_graph(X_test, y_test)
    
    # Register training cohort reference for inductive inference
    train_meta = train_df.to_dict(orient="records")
    graph_builder.set_reference_cohort(X_train, y_train, train_meta)
    torch.save(
        {
            "reference_nodes": graph_builder.reference_nodes,
            "reference_labels": graph_builder.reference_labels,
            "reference_metadata": graph_builder.reference_metadata,
            "k_neighbors": graph_builder.k_neighbors,
            "rbf_gamma": graph_builder.rbf_gamma
        },
        model_dir / "reference_graph.pt"
    )
    
    # Handle class imbalance
    class_weights = compute_class_weight("balanced", classes=np.unique(y_train), y=y_train)
    weights_tensor = torch.tensor(class_weights, dtype=torch.float32)
    
    model = NeuroGraphGAT(in_channels=X_train.shape[1], hidden_channels=16, num_classes=2, heads=4, dropout=0.2)
    criterion = nn.CrossEntropyLoss(weight=weights_tensor)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
    
    best_val_loss = float("inf")
    best_model_state = None
    epochs_no_improve = 0
    
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}
    
    print("Beginning Graph Attention Network training loop...")
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()
        out = model(train_graph.x, train_graph.edge_index)
        loss = criterion(out, train_graph.y)
        loss.backward()
        optimizer.step()
        
        # Calculate training accuracy
        train_preds = out.argmax(dim=-1)
        train_acc = (train_preds == train_graph.y).sum().item() / len(train_graph.y)
        
        # Validation pass
        model.eval()
        with torch.no_grad():
            val_out = model(val_graph.x, val_graph.edge_index)
            val_loss = criterion(val_out, val_graph.y).item()
            val_preds = val_out.argmax(dim=-1)
            val_acc = (val_preds == val_graph.y).sum().item() / len(val_graph.y)
            
        history["train_loss"].append(round(float(loss.item()), 4))
        history["val_loss"].append(round(float(val_loss), 4))
        history["train_acc"].append(round(float(train_acc), 4))
        history["val_acc"].append(round(float(val_acc), 4))
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = model.state_dict().copy()
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= patience:
                print(f"Early stopping at epoch {epoch}. Best validation loss: {best_val_loss:.4f}")
                break
                
        if epoch % 20 == 0 or epoch == 1:
            print(f"Epoch {epoch:03d} | Train Loss: {loss.item():.4f} Acc: {train_acc:.3f} | Val Loss: {val_loss:.4f} Acc: {val_acc:.3f}")
            
    # Load best checkpoint and save
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
    torch.save(model.state_dict(), model_dir / "gnn_model.pt")
    
    # Save training metadata
    metadata = {
        "model_name": "NeuroGraph GAT",
        "model_version": "1.0.0",
        "architecture": "Graph Attention Network (GATConv 4-heads, BN, ELU, GATConv 1-head)",
        "dataset": "OASIS-2 Longitudinal MRI Dataset",
        "total_records": len(df),
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "supported_features": FEATURE_COLUMNS,
        "target_classes": ["Nondemented", "Demented"],
        "is_trained": True,
        "last_trained_timestamp": datetime.now(timezone.utc).isoformat(),
        "hyperparameters": {
            "learning_rate": lr,
            "weight_decay": weight_decay,
            "k_neighbors": 5,
            "rbf_gamma": 0.25,
            "random_seed": seed
        },
        "history": history
    }
    with open(model_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Model and training artifacts saved to {model_dir}")
    return model, test_graph, test_df, history

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent
    train_model(data_dir=base / "data", model_dir=base / "models")
