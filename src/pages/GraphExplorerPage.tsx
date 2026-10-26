import React, { useState, useEffect } from 'react';
import {
  Share2,
  Filter,
  Layers,
  Info,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { GraphViewer } from '../components/GraphViewer';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { GraphDataPayload, PageId } from '../types';

interface Props {
  onNavigate: (page: PageId) => void;
}

// Generate realistic cohort network from OASIS baseline prototypes for standalone exploration
function generateCohortGraph(threshold = 0.65): GraphDataPayload {
  const subjects = [
    { id: 'OAS2_0001', label: 'OAS2_0001\n(Non)', diag: 'Nondemented', age: 87, mmse: 27, nwbv: 0.696 },
    { id: 'OAS2_0002', label: 'OAS2_0002\n(Dem)', diag: 'Demented', age: 75, mmse: 23, nwbv: 0.736 },
    { id: 'OAS2_0004', label: 'OAS2_0004\n(Non)', diag: 'Nondemented', age: 88, mmse: 28, nwbv: 0.711 },
    { id: 'OAS2_0005', label: 'OAS2_0005\n(Non)', diag: 'Nondemented', age: 80, mmse: 28, nwbv: 0.701 },
    { id: 'OAS2_0007', label: 'OAS2_0007\n(Dem)', diag: 'Demented', age: 71, mmse: 28, nwbv: 0.748 },
    { id: 'OAS2_0008', label: 'OAS2_0008\n(Non)', diag: 'Nondemented', age: 93, mmse: 30, nwbv: 0.682 },
    { id: 'OAS2_0009', label: 'OAS2_0009\n(Dem)', diag: 'Demented', age: 68, mmse: 27, nwbv: 0.779 },
    { id: 'OAS2_0010', label: 'OAS2_0010\n(Dem)', diag: 'Demented', age: 66, mmse: 29, nwbv: 0.741 },
    { id: 'OAS2_0012', label: 'OAS2_0012\n(Non)', diag: 'Nondemented', age: 78, mmse: 29, nwbv: 0.723 },
    { id: 'OAS2_0013', label: 'OAS2_0013\n(Non)', diag: 'Nondemented', age: 81, mmse: 30, nwbv: 0.767 },
    { id: 'OAS2_0014', label: 'OAS2_0014\n(Dem)', diag: 'Demented', age: 76, mmse: 21, nwbv: 0.705 },
    { id: 'OAS2_0017', label: 'OAS2_0017\n(Non)', diag: 'Nondemented', age: 77, mmse: 29, nwbv: 0.775 },
    { id: 'OAS2_0018', label: 'OAS2_0018\n(Dem)', diag: 'Demented', age: 87, mmse: 23, nwbv: 0.694 },
    { id: 'OAS2_0020', label: 'OAS2_0020\n(Dem)', diag: 'Demented', age: 80, mmse: 23, nwbv: 0.734 },
    { id: 'OAS2_0026', label: 'OAS2_0026\n(Non)', diag: 'Nondemented', age: 76, mmse: 30, nwbv: 0.758 },
  ];

  const nodes = subjects.map((s) => ({
    data: {
      id: s.id,
      label: s.label,
      type: 'reference',
      diagnosis: s.diag,
      age: s.age,
      mmse: s.mmse,
      nwbv: s.nwbv,
      color: s.diag === 'Demented' ? '#dc2626' : '#10b981',
    },
  }));

  const edges: any[] = [];
  for (let i = 0; i < subjects.length; i++) {
    for (let j = i + 1; j < subjects.length; j++) {
      const a = subjects[i];
      const b = subjects[j];
      // Compute phenotypic similarity based on clinical closeness
      const ageDiff = Math.abs(a.age - b.age) / 30;
      const mmseDiff = Math.abs(a.mmse - b.mmse) / 10;
      const nwbvDiff = Math.abs(a.nwbv - b.nwbv) / 0.15;
      const diagBonus = a.diag === b.diag ? 0.2 : 0.0;
      const rawSim = 1.0 - (ageDiff * 0.3 + mmseDiff * 0.4 + nwbvDiff * 0.3) + diagBonus;
      const sim = Math.min(1.0, Math.max(0.1, rawSim));

      if (sim >= threshold) {
        edges.push({
          data: {
            id: `e_${a.id}_${b.id}`,
            source: a.id,
            target: b.id,
            weight: sim,
            label: `${Math.round(sim * 100)}%`,
          },
        });
      }
    }
  }

  return { nodes, edges };
}

export const GraphExplorerPage: React.FC<Props> = ({ onNavigate }) => {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.68);
  const [filterDiag, setFilterDiag] = useState<'all' | 'Nondemented' | 'Demented'>('all');
  const [graphData, setGraphData] = useState<GraphDataPayload>(() =>
    generateCohortGraph(0.68)
  );

  useEffect(() => {
    const raw = generateCohortGraph(similarityThreshold);
    if (filterDiag === 'all') {
      setGraphData(raw);
    } else {
      const filteredNodes = raw.nodes.filter((n) => n.data.diagnosis === filterDiag);
      const validNodeIds = new Set(filteredNodes.map((n) => n.data.id));
      const filteredEdges = raw.edges.filter(
        (e) => validNodeIds.has(e.data.source) && validNodeIds.has(e.data.target)
      );
      setGraphData({ nodes: filteredNodes, edges: filteredEdges });
    }
  }, [similarityThreshold, filterDiag]);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Interactive Patient-Similarity Graph Explorer
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-medblue-100 text-medblue-800">
              Cytoscape.js Network Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore topological clusters, edge similarity weights, and neighbor phenotypes across OASIS benchmark patients.
          </p>
        </div>
      </div>

      <DisclaimerBanner variant="info" />

      {/* Filter and threshold bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Similarity Threshold Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-medblue-600" />
            <span>Similarity Cutoff (&ge;):</span>
          </div>
          <input
            type="range"
            min={0.50}
            max={0.85}
            step={0.02}
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="w-32 sm:w-44 accent-medblue-600 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded">
            {Math.round(similarityThreshold * 100)}%
          </span>
        </div>

        {/* Diagnosis Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Cohort Filter:</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs bg-slate-50">
            <button
              onClick={() => setFilterDiag('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterDiag === 'all'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              All Cohort
            </button>
            <button
              onClick={() => setFilterDiag('Nondemented')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterDiag === 'Nondemented'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Nondemented
            </button>
            <button
              onClick={() => setFilterDiag('Demented')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterDiag === 'Demented'
                  ? 'bg-rose-50 text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Demented
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Component */}
      <GraphViewer
        graphData={graphData}
        title="OASIS Patient-Similarity Graph Network"
        subtitle="Nodes represent patients; edges represent phenotypic similarity above selected threshold"
        height="560px"
      />

      {/* Explanatory Methodology Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-navy-900 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-medblue-600" />
          <span>Graph Construction Protocol in NeuroGraph AI</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          In our research framework, each patient is represented as a node v_i in V characterized by feature vector x_i in R^8 encompassing normalized age, sex, education, SES, MMSE, and stereotaxic brain volumetric ratios (eTIV, nWBV, ASF). Edges are formed between pairs (i, j) whose Gaussian RBF kernel similarity exceeds threshold tau:
        </p>
        <div className="p-3 bg-slate-50 rounded-lg font-mono text-xs text-navy-900 overflow-x-auto text-center">
          {"A_{ij} = exp(-gamma * ||x_i - x_j||^2)  for  A_{ij} >= tau"}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Graph Attention Network (GAT) learns multi-head attention coefficients $\alpha_{'{ij}'}$ dynamically across these edges during message passing, allowing the model to weight phenotypic neighbors according to diagnostic relevance.
        </p>
      </div>
    </div>
  );
};
