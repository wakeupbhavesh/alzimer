"""PyTorch Geometric Graph Neural Network architecture for Alzheimer's diagnosis."""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv, BatchNorm

class NeuroGraphGAT(nn.Module):
    """
    Graph Attention Network (GAT) for node-level Alzheimer's disease prediction.
    
    Architecture:
    - Layer 1: Multi-head Graph Attention Conv (8 input features -> 16 hidden * 4 heads = 64 features)
    - Batch Normalization & ELU activation
    - Dropout for regularization
    - Layer 2: Final Graph Attention Conv (64 features -> 2 class logits, 1 head)
    """
    def __init__(
        self,
        in_channels: int = 8,
        hidden_channels: int = 16,
        num_classes: int = 2,
        heads: int = 4,
        dropout: float = 0.2
    ):
        super().__init__()
        self.dropout = dropout
        
        # Layer 1: Multi-head attention
        self.conv1 = GATConv(
            in_channels=in_channels,
            out_channels=hidden_channels,
            heads=heads,
            concat=True,
            dropout=dropout
        )
        self.bn1 = BatchNorm(hidden_channels * heads)
        
        # Layer 2: Aggregate to class logits
        self.conv2 = GATConv(
            in_channels=hidden_channels * heads,
            out_channels=num_classes,
            heads=1,
            concat=False,
            dropout=dropout
        )

    def forward(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor,
        edge_attr: torch.Tensor = None
    ) -> torch.Tensor:
        # Multi-head graph attention message passing
        x = self.conv1(x, edge_index)
        x = self.bn1(x)
        x = F.elu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        
        # Final aggregation layer
        logits = self.conv2(x, edge_index)
        return logits

    def get_probabilities(
        self,
        x: torch.Tensor,
        edge_index: torch.Tensor
    ) -> torch.Tensor:
        """Compute normalized class probabilities via softmax."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x, edge_index)
            probs = F.softmax(logits, dim=-1)
        return probs
