"""Unit tests for Patient Graph Builder and Inductive Subgraph construction."""
import numpy as np
import torch
import pytest
from ml.graph_builder import PatientGraphBuilder

def test_graph_builder_structure():
    np.random.seed(42)
    X = np.random.randn(15, 8).astype(np.float32)
    y = np.array([0, 1] * 7 + [0], dtype=np.int64)
    
    builder = PatientGraphBuilder(k_neighbors=4, rbf_gamma=0.25)
    data = builder.build_graph(X, y)
    
    assert data.x.shape == (15, 8)
    assert data.edge_index.shape[0] == 2
    assert data.edge_index.shape[1] > 0
    assert data.edge_attr.shape[0] == data.edge_index.shape[1]
    assert data.y.shape == (15,)

def test_inductive_subgraph_construction():
    np.random.seed(42)
    X_ref = np.random.randn(20, 8).astype(np.float32)
    y_ref = np.random.choice([0, 1], size=20)
    meta_list = [{"Subject ID": f"REF_{i}", "Age": 70 + i, "MMSE": 26, "nWBV": 0.72} for i in range(20)]
    
    builder = PatientGraphBuilder(k_neighbors=5, rbf_gamma=0.25)
    builder.set_reference_cohort(X_ref, y_ref, meta_list)
    
    x_query = np.random.randn(1, 8).astype(np.float32)
    query_data, neighbors, graph_payload = builder.build_inductive_subgraph(x_query)
    
    # Query subgraph must have query node at index 0 + 5 neighbors = 6 nodes
    assert query_data.x.shape == (6, 8)
    assert len(neighbors) == 5
    assert len(graph_payload["nodes"]) == 6  # 1 query node + 5 neighbor nodes
    assert len(graph_payload["edges"]) == 5  # 5 links between query and neighbors
    
    # Check that neighbor similarities are properly formatted
    for n in neighbors:
        assert "similarity" in n
        assert "diagnosis" in n
        assert n["diagnosis"] in ("Nondemented", "Demented")
