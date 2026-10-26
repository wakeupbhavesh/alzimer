import React from 'react';
import {
  Activity,
  Share2,
  Cpu,
  ArrowRight,
  Database,
  BarChart3,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageId, HealthResponse } from '../types';

interface Props {
  onNavigate: (page: PageId) => void;
  health: HealthResponse | null;
}

export const LandingPage: React.FC<Props> = ({ onNavigate, health }) => {
  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-medblue-50/50 to-medblue-100/40 border border-medblue-100 p-8 sm:p-12 shadow-sm">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-medblue-100 text-medblue-800 border border-medblue-200">
            <span className="w-2 h-2 rounded-full bg-medblue-600 animate-pulse"></span>
            Academic Research Prototype • PyTorch Geometric GNN
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
            Predict Alzheimer's Disease Using{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-medblue-600 to-medblue-800">
              Graph Neural Networks
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            NeuroGraph AI models clinical cohorts as Patient-Similarity Graphs (PSGs). By capturing relational topological patterns across cognitive assessments and volumetric neuroimaging biomarkers, our multi-head Graph Attention Network (GAT) performs inductive inference for unseen patients while preventing clinical data leakage.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={() => onNavigate('assessment')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-medblue-600 hover:bg-medblue-700 text-white font-semibold text-sm shadow-md shadow-medblue-200 hover:shadow-lg transition-all"
            >
              <span>Begin Patient Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-medblue-600" />
              <span>Explore Research Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('graph-explorer')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
            >
              <Share2 className="w-4 h-4 text-medblue-600" />
              <span>Interactive Graph</span>
            </button>
          </div>
        </div>
      </section>

      {/* Clinical Disclaimer */}
      <DisclaimerBanner variant="warning" />

      {/* Core Innovation Highlights */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">
            Scientific Framework & Methodology
          </h2>
          <p className="text-sm text-slate-500">
            Engineered to overcome limitations of traditional tabular classifiers in neurodegenerative disorder prediction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-medblue-50 text-medblue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy-900 text-base">
              Patient-Similarity Graph (PSG)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Patients are modeled as graph nodes connected by $k$-NN Gaussian RBF similarity across standardized cognitive (MMSE) and volumetric neuroimaging (eTIV, nWBV, ASF) biomarkers.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy-900 text-base">
              Inductive Graph Attention (GAT)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Implemented using PyTorch Geometric with 4-head attention layers and batch normalization. Unseen test patients are embedded inductively via local subgraphs without retraining.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy-900 text-base">
              Strict Zero-Leakage Protocol
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluated on the authentic OASIS-2 longitudinal benchmark (373 records, 150 subjects). Stratified strictly at the subject level with target-defining CDR excluded from input features.
            </p>
          </div>
        </div>
      </section>

      {/* Model Status Snapshot */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-medblue-50 flex items-center justify-center text-medblue-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-navy-900">
              Backend Status: {health?.status === 'healthy' ? 'Operational' : 'Connecting...'}
            </div>
            <div className="text-xs text-slate-500">
              Model Checkpoint: {health?.model_available ? 'Verified (PyTorch Geometric GAT)' : 'Unavailable'} • Dataset: OASIS-2 Longitudinal
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('evaluation')}
            className="text-xs font-semibold text-medblue-700 hover:text-medblue-800 bg-medblue-50 px-3.5 py-2 rounded-lg border border-medblue-200 hover:bg-medblue-100 transition-colors"
          >
            View Held-Out Test Metrics →
          </button>
        </div>
      </section>
    </div>
  );
};
