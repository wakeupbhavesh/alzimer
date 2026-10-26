import React from 'react';
import { BookOpen, Share2, Brain, Cpu, Database, Award, ExternalLink } from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageId } from '../types';

interface Props {
  onNavigate: (page: PageId) => void;
}

export const AboutProjectPage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            About NeuroGraph AI
          </h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-medblue-100 text-medblue-800">
            Academic Research Project
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Graph Neural Networks for Alzheimer's disease diagnosis via phenotypic patient-similarity topological representations.
        </p>
      </div>

      <DisclaimerBanner variant="info" />

      {/* Rationale Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-medblue-600" />
          <span>Why Graph Neural Networks for Alzheimer's Disease?</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Traditional tabular machine learning models (such as Support Vector Machines, Random Forests, or standard Multilayer Perceptrons) evaluate patient records in isolation under the strong assumption of Independent and Identically Distributed (IID) observations.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          However, clinical neurodegeneration exhibits continuous spectrums of disease progression, where individuals with similar cognitive scores and localized brain volumetric atrophy follow comparable phenotypic trajectories. By formulating the cohort as a <strong>Patient-Similarity Graph (PSG)</strong>, Graph Neural Networks leverage non-Euclidean topological neighborhood structures to aggregate relational contextual information from clinically similar peers.
        </p>
      </section>

      {/* Mathematical Formulation */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-medblue-600" />
          <span>Mathematical Formulation & Graph Attention Mechanism</span>
        </h2>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Patient-Similarity Graph Construction
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Let G = (V, E, X) denote the patient graph where each node v_i in V represents a patient scan with feature vector x_i in R^8 (Age, Sex, EDUC, SES, MMSE, eTIV, nWBV, ASF). Undirected edges (i, j) in E are constructed using k-Nearest Neighbors (k=5) with Gaussian RBF similarity weights:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-navy-900 text-center overflow-x-auto">
            {"W_{ij} = exp(-gamma * ||x_i - x_j||^2)  for  j in N_k(i)"}
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Multi-Head Graph Attention Layer (GATConv)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            For node i, the attention coefficient alpha_ij for head k indicates the importance of neighbor j's clinical features to node i:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-navy-900 text-center overflow-x-auto">
            {"alpha_{ij}^k = softmax_j( LeakyReLU( a^T [W^k x_i || W^k x_j] ) )"}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Node representations are updated via multi-head aggregation, batch normalization, and ELU activation:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-navy-900 text-center overflow-x-auto">
            {"h_i^{(1)} = ||_{k=1}^K sigma( sum_{j in N(i) U {i}} alpha_{ij}^k W^k x_j )"}
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Inductive Out-of-Sample Inference
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When an unseen query patient $u$ arrives, $u$ is embedded as a new node linked to its $k$-nearest neighbors among reference training prototypes. The local query subgraph is evaluated by the trained GAT model in a single forward pass, producing class logits for Nondemented vs Demented.
          </p>
        </div>
      </section>

      {/* Dataset Citation */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-medblue-600" />
          <span>Dataset Citation & Benchmark Integrity</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          This project evaluates performance on the authentic <strong>OASIS-2: Longitudinal MRI Data in Nondemented and Demented Older Adults</strong>, provided by Washington University in St. Louis.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-navy-900">Official Citation:</div>
          <blockquote className="italic border-l-2 border-medblue-500 pl-3">
            Marcus, D.S., Fotenos, A.F., Csernansky, J.G., Morris, J.C., & Buckner, R.L. (2010). Open Access Series of Imaging Studies: Longitudinal MRI Data in Nondemented and Demented Older Adults. <em>Journal of Cognitive Neuroscience</em>, 22(12), 2677–2684.
          </blockquote>
        </div>

        <div className="text-xs text-slate-500 leading-relaxed pt-2">
          <strong>Cohort Specification:</strong> 150 subjects aged 60 to 96 years. Each subject was scanned on two or more visits, separated by at least one year, for a total of 373 imaging sessions.
        </div>
      </section>
    </div>
  );
};
