import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  ArrowLeft,
  FileSpreadsheet,
  Brain,
  Cpu,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { GraphViewer } from '../components/GraphViewer';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PredictionResponse, PageId } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Props {
  result: PredictionResponse | null;
  onNavigate: (page: PageId) => void;
}

export const PredictionResultPage: React.FC<Props> = ({ result, onNavigate }) => {
  if (!result) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Brain className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-navy-900">No Assessment Loaded</h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Please run a new patient assessment intake form to generate Graph Neural Network inductive predictions.
        </p>
        <button
          onClick={() => onNavigate('assessment')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-medblue-600 hover:bg-medblue-700 text-white font-semibold text-xs shadow-xs transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Go to Patient Assessment Intake</span>
        </button>
      </div>
    );
  }

  const isDemented = result.prediction_label === 'Demented';
  const probData = [
    {
      name: 'Nondemented',
      probability: Number((result.probabilities.Nondemented * 100).toFixed(1)),
      color: '#10b981',
    },
    {
      name: 'Demented',
      probability: Number((result.probabilities.Demented * 100).toFixed(1)),
      color: '#e11d48',
    },
  ];

  const handleDownloadReport = () => {
    const reportContent = `===================================================================
NEUROGRAPH AI — RESEARCH PREDICTION REPORT
Academic Research Prototype • Graph Neural Network Benchmark
===================================================================
Patient Reference ID : ${result.patient_ref_id}
Assessment Timestamp : ${result.timestamp}
Model Architecture   : PyTorch Geometric GAT (Graph Attention Network)
Model Version        : v${result.model_version}

-------------------------------------------------------------------
GNN PREDICTION SUMMARY
-------------------------------------------------------------------
Predicted Category   : ${result.prediction_label}
Model Confidence     : ${(result.confidence * 100).toFixed(2)}%
Probability (Non)    : ${(result.probabilities.Nondemented * 100).toFixed(2)}%
Probability (Dem)    : ${(result.probabilities.Demented * 100).toFixed(2)}%

-------------------------------------------------------------------
TOP-K NEAREST REFERENCE NEIGHBORS (PATIENT-SIMILARITY GRAPH)
-------------------------------------------------------------------
${result.nearest_neighbors
  .map(
    (n, idx) =>
      `[#${idx + 1}] Subject: ${n.id} | Diagnosis: ${n.diagnosis.padEnd(12)} | Similarity: ${n.similarity}% | MMSE: ${n.mmse ?? 'N/A'} | nWBV: ${n.nwbv}`
  )
  .join('\n')}

-------------------------------------------------------------------
INPUT FEATURE SUMMARY & COHORT COMPARISONS
-------------------------------------------------------------------
${Object.entries(result.feature_summary)
  .map(([k, v]) => `${k.padEnd(10)}: Patient = ${v.patient_value ?? 'Imputed'} | Cohort Median = ${v.cohort_median ?? 'N/A'}`)
  .join('\n')}

===================================================================
DISCLAIMER & LIMITATIONS
===================================================================
${result.disclaimer}
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NeuroGraph_${result.patient_ref_id}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('assessment')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessment Intake</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-medblue-600 hover:bg-medblue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Research Report</span>
          </button>
        </div>
      </div>

      <DisclaimerBanner variant="warning" />

      {/* Main Result Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Assessment Result • {result.patient_ref_id}
            </span>
            <div className="flex items-center gap-3 mt-1.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDemented ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {result.prediction_label}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isDemented
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {(result.confidence * 100).toFixed(1)}% Confidence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Topological classification derived from message passing across {result.nearest_neighbors.length} nearest cohort prototypes.
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-0.5">
            <div><span className="font-medium text-slate-600">Model:</span> PyG GAT v{result.model_version}</div>
            <div><span className="font-medium text-slate-600">Evaluated:</span> {new Date(result.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Probability Chart & Neighborhood Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class Probability Distribution */}
          <div className="space-y-3">
            <h3 className="font-bold text-navy-900 text-xs uppercase tracking-wider text-slate-500">
              GNN Softmax Class Probability Distribution
            </h3>
            <div className="h-40 bg-slate-50/60 rounded-xl p-3 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={probData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => `${value}%`} />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                    {probData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Note: Probabilities represent raw GNN softmax outputs over patient-similarity graph embeddings and should not be interpreted as clinically calibrated risk.
            </p>
          </div>

          {/* Top-K Reference Neighbors Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-navy-900 text-xs uppercase tracking-wider text-slate-500">
              Nearest Reference Cohort Prototypes
            </h3>
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">Subject</th>
                    <th className="p-2.5">Diagnosis</th>
                    <th className="p-2.5">Similarity</th>
                    <th className="p-2.5">MMSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.nearest_neighbors.map((n, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-medium text-navy-900">{n.id}</td>
                      <td className="p-2.5">
                        <span
                          className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                            n.diagnosis === 'Demented'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {n.diagnosis}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-700">{n.similarity}%</td>
                      <td className="p-2.5 font-mono text-slate-700">{n.mmse ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Neighborhood Graph Visualizer */}
      <GraphViewer
        graphData={result.graph_data}
        title={`Topological Neighborhood: ${result.patient_ref_id}`}
        subtitle="Inductive subgraph connecting the query patient (blue) to training cohort neighbors"
        height="460px"
      />

      {/* Input Feature Summary vs Cohort Medians */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-navy-900 text-sm">
            Input Feature Summary & Reference Cohort Norms
          </h3>
          <span className="text-xs text-slate-500 font-medium">OASIS-2 Baseline Comparison</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(result.feature_summary).map(([key, item]) => (
            <div key={key} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {key}
              </div>
              <div className="text-lg font-bold font-mono text-navy-900 mt-0.5">
                {item.patient_value !== null && item.patient_value !== undefined
                  ? String(item.patient_value)
                  : 'Imputed'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Cohort Median: {item.cohort_median !== undefined ? item.cohort_median : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
