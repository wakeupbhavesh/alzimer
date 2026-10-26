"""Patient-Similarity Graph (PSG) construction and inductive query graph builder."""
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import torch
from torch_geometric.data import Data
from sklearn.metrics.pairwise import cosine_similarity, rbf_kernel

class PatientGraphBuilder:
    """
    Constructs a Patient-Similarity Graph (PSG) from clinical and neuroimaging node features.
    
    Graph Construction Protocol:
    - Nodes: Patient clinical records.
    - Node Features: Standardized demographic, cognitive, and volumetric variables.
    - Edges: k-Nearest Neighbor (k-NN) graph weighted by Gaussian RBF similarity.
    - Inductive Inference: For unseen query patients, computes top-k similarity to training
      cohort nodes and attaches the query node to the reference graph.
    """
    def __init__(self, k_neighbors: int = 5, rbf_gamma: float = 0.25):
        self.k_neighbors = k_neighbors
        self.rbf_gamma = rbf_gamma
        self.reference_nodes: Optional[torch.Tensor] = None
        self.reference_labels: Optional[torch.Tensor] = None
        self.reference_metadata: List[Dict[str, Any]] = []

    def set_reference_cohort(
        self,
        X_ref: np.ndarray,
        y_ref: np.ndarray,
        metadata_list: List[Dict[str, Any]]
    ) -> None:
        """Register the training cohort as reference prototypes for inductive inference."""
        self.reference_nodes = torch.tensor(X_ref, dtype=torch.float32)
        self.reference_labels = torch.tensor(y_ref, dtype=torch.long)
        self.reference_metadata = metadata_list

    def build_graph(
        self,
        X: np.ndarray,
        y: Optional[np.ndarray] = None
    ) -> Data:
        """
        Construct a PyTorch Geometric Data graph from feature matrix X.
        Uses k-NN with RBF similarity edge weights.
        """
        n_samples = X.shape[0]
        k = min(self.k_neighbors, n_samples - 1)
        
        sim_matrix = rbf_kernel(X, gamma=self.rbf_gamma)
        # Zero-out self-loops in neighbor search
        np.fill_diagonal(sim_matrix, 0.0)
        
        edge_sources = []
        edge_targets = []
        edge_weights = []
        
        for i in range(n_samples):
            # Find indices of top-k most similar patients
            top_k_idx = np.argsort(sim_matrix[i])[-k:]
            for neighbor in top_k_idx:
                w = float(sim_matrix[i, neighbor])
                if w > 0.05:  # Similarity cutoff threshold
                    edge_sources.append(i)
                    edge_targets.append(neighbor)
                    edge_weights.append(w)
                    
                    # Ensure bidirectional / undirected connectivity
                    edge_sources.append(neighbor)
                    edge_targets.append(i)
                    edge_weights.append(w)
                    
        # Remove duplicate undirected edges
        unique_edges = {}
        for s, t, w in zip(edge_sources, edge_targets, edge_weights):
            pair = (s, t)
            if pair not in unique_edges or w > unique_edges[pair]:
                unique_edges[pair] = w
                
        if len(unique_edges) == 0:
            # Fallback self-loop if graph is disconnected
            edge_index = torch.empty((2, 0), dtype=torch.long)
            edge_attr = torch.empty((0, 1), dtype=torch.float32)
        else:
            edge_index = torch.tensor(list(unique_edges.keys()), dtype=torch.long).t().contiguous()
            edge_attr = torch.tensor(list(unique_edges.values()), dtype=torch.float32).unsqueeze(1)
            
        x_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.long) if y is not None else None
        
        return Data(x=x_tensor, edge_index=edge_index, edge_attr=edge_attr, y=y_tensor)

    def build_inductive_subgraph(
        self,
        x_query: np.ndarray
    ) -> Tuple[Data, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Build an inductive local graph connecting an unseen query patient
        to its top-k most similar reference training patients.
        
        Returns:
            - PyG Data object ready for GNN forward pass (query node is index 0).
            - List of nearest neighbor descriptions for Cytoscape.js visualization.
            - Cytoscape-formatted graph payload.
        """
        if self.reference_nodes is None:
            raise RuntimeError("Reference cohort is not set. Call set_reference_cohort first.")
            
        ref_np = self.reference_nodes.numpy()
        # Compute RBF similarity and cosine similarity
        rbf_sims = rbf_kernel(x_query, ref_np, gamma=self.rbf_gamma)[0]
        cos_sims = cosine_similarity(x_query, ref_np)[0]
        
        k = min(self.k_neighbors, len(ref_np))
        top_k_indices = np.argsort(rbf_sims)[-k:][::-1]
        
        # Subgraph node features: index 0 is query patient, indices 1..k are reference neighbors
        subgraph_nodes = [torch.tensor(x_query, dtype=torch.float32)]
        for idx in top_k_indices:
            subgraph_nodes.append(self.reference_nodes[idx:idx+1])
        x_subgraph = torch.cat(subgraph_nodes, dim=0)
        
        # Construct bidirectional edges between query node (0) and each neighbor (1..k)
        edge_sources = []
        edge_targets = []
        edge_weights = []
        
        neighbor_details = []
        cytoscape_nodes = [{
            "data": {
                "id": "query_node",
                "label": "Patient (Query)",
                "type": "query",
                "color": "#0284c7"
            }
        }]
        cytoscape_edges = []
        
        for local_idx, ref_idx in enumerate(top_k_indices, start=1):
            weight = float(rbf_sims[ref_idx])
            cos_sim = float(cos_sims[ref_idx])
            
            # Subgraph edge indices
            edge_sources.extend([0, local_idx])
            edge_targets.extend([local_idx, 0])
            edge_weights.extend([weight, weight])
            
            ref_meta = self.reference_metadata[ref_idx] if ref_idx < len(self.reference_metadata) else {}
            diag_label = "Demented" if int(self.reference_labels[ref_idx]) == 1 else "Nondemented"
            
            neighbor_details.append({
                "id": ref_meta.get("Subject ID", f"REF-{ref_idx}"),
                "similarity": round(cos_sim * 100, 1),
                "rbf_weight": round(weight, 3),
                "diagnosis": diag_label,
                "age": ref_meta.get("Age", 75),
                "mmse": ref_meta.get("MMSE", 27),
                "nwbv": ref_meta.get("nWBV", 0.72),
                "label": f"{diag_label} ({round(cos_sim * 100, 1)}% sim)"
            })
            
            # Cytoscape node & edge
            ref_id = f"ref_{ref_meta.get('Subject ID', ref_idx)}"
            cytoscape_nodes.append({
                "data": {
                    "id": ref_id,
                    "label": f"{ref_meta.get('Subject ID', f'Ref-{ref_idx}')}\n({diag_label})",
                    "type": "reference",
                    "diagnosis": diag_label,
                    "color": "#dc2626" if diag_label == "Demented" else "#10b981"
                }
            })
            cytoscape_edges.append({
                "data": {
                    "id": f"e_query_{ref_id}",
                    "source": "query_node",
                    "target": ref_id,
                    "weight": weight,
                    "label": f"{round(cos_sim * 100)}%"
                }
            })
            
        edge_index = torch.tensor([edge_sources, edge_targets], dtype=torch.long)
        edge_attr = torch.tensor(edge_weights, dtype=torch.float32).unsqueeze(1)
        
        query_data = Data(x=x_subgraph, edge_index=edge_index, edge_attr=edge_attr)
        graph_payload = {"nodes": cytoscape_nodes, "edges": cytoscape_edges}
        
        return query_data, neighbor_details, graph_payload
