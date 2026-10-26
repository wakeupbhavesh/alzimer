"""Unit tests for PyTorch Geometric Graph Attention Network architecture."""
import torch
import pytest
from ml.model import NeuroGraphGAT

def test_gat_forward_pass_and_shape():
    model = NeuroGraphGAT(in_channels=8, hidden_channels=16, num_classes=2, heads=4, dropout=0.1)
    
    # Create synthetic test graph (6 nodes, 10 edges)
    x = torch.randn(6, 8)
    edge_index = torch.tensor([
        [0, 1, 1, 2, 2, 3, 3, 4, 4, 5],
        [1, 0, 2, 1, 3, 2, 4, 3, 5, 4]
    ], dtype=torch.long)
    
    # Train mode
    model.train()
    logits = model(x, edge_index)
    assert logits.shape == (6, 2)
    
    # Eval mode probabilities
    probs = model.get_probabilities(x, edge_index)
    assert probs.shape == (6, 2)
    
    # Verify probabilities sum to 1.0 per node
    sums = probs.sum(dim=-1).numpy()
    for s in sums:
        assert abs(s - 1.0) < 1e-5
