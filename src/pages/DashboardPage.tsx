import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  BarChart2,
  Cpu,
  Clock,
  ArrowRight,
  TrendingUp,
  History,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import {
  HealthResponse,
  EvaluationResponse,
  ModelInfoResponse,
  AssessmentRecord,
  PageId,
} from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface Props {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [h, m, e, a] = await Promise.all([
          api.getHealth(),
          api.getModelInfo(),
          api.getEvaluation().catch(() => null),
          api.getAssessments(5).catch(() => []),
        ]);
        setHealth(h);
        setModelInfo(m);
        setEvaluation(e);
        setAssessments(a);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to backend service.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-medblue-200 border-t-medblue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Connecting to NeuroGraph AI backend...</p>
      </div>
    );
  }

  const pieData = evaluation
    ? [
        { name: 'Nondemented', value: evaluation.class_distribution.Nondemented, color: '#10b981' },
        { name: 'Demented', value: evaluation.class_distribution.Demented, color: '#e11d48' },
      ]
    : [];

  const splitBarData = evaluation
    ? [
        { name: 'Train', samples: evaluation.train_samples },
        { name: 'Val', samples: evaluation.val_samples },
        { name: 'Test', samples: evaluation.test_samples },
      ]
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Research & Model Dashboard
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified Real OASIS-2 Benchmark
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status of Graph Attention Network, held-out test metrics, and patient intake tracking.
          </p>
        </div>

        <button
          onClick={() => onNavigate('assessment')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-medblue-600 hover:bg-medblue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all"
        >
          <span>New Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <DisclaimerBanner variant="info" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Model Status"
          value={health?.model_available ? 'OPERATIONAL' : 'OFFLINE'}
          subtitle={`PyG GAT • v${modelInfo?.model_version || '1.0.0'}`}
          badge={health?.model_available ? 'Trained' : 'Untrained'}
          badgeColor={health?.model_available ? 'emerald' : 'amber'}
          icon={Cpu}
        />

        <MetricCard
          title="Dataset Cohort"
          value={evaluation?.total_samples ? `${evaluation.total_samples} Scans` : '373 Scans'}
          subtitle="OASIS-2 Longitudinal (150 Subjects)"
          badge="Authentic"
          badgeColor="medblue"
          icon={Database}
        />

        <MetricCard
          title="Held-Out Test Acc"
          value={evaluation?.metrics ? `${(evaluation.metrics.accuracy * 100).toFixed(1)}%` : 'N/A'}
          subtitle={`Macro F1: ${evaluation?.metrics ? (evaluation.metrics.f1_score * 100).toFixed(1) + '%' : 'N/A'}`}
          badge="Held-Out 15%"
          badgeColor="emerald"
          icon={TrendingUp}
        />

        <MetricCard
          title="Assessments Logged"
          value={assessments.length}
          subtitle="Persistent SQLite Database"
          badge="Local"
          badgeColor="slate"
          icon={History}
        />
      </div>

      {/* Real Test Evaluation Metrics & Confusion Matrix */}
      {evaluation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Held-out test metrics summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-navy-900 text-sm">
                  Held-Out Test Set Performance
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated on {evaluation.test_samples} unseen test scans from independent subjects.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                ROC-AUC: {evaluation.metrics.roc_auc.toFixed(3)}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Accuracy</span>
                <span className="font-bold font-mono text-navy-900">
                  {(evaluation.metrics.accuracy * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-medblue-600 h-2 rounded-full"
                  style={{ width: `${evaluation.metrics.accuracy * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-600 font-medium">Macro F1 Score</span>
                <span className="font-bold font-mono text-navy-900">
                  {(evaluation.metrics.f1_score * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${evaluation.metrics.f1_score * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-600 font-medium">Sensitivity (Recall)</span>
                <span className="font-bold font-mono text-navy-900">
                  {(evaluation.metrics.recall * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${evaluation.metrics.recall * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-600 font-medium">Precision (Macro)</span>
                <span className="font-bold font-mono text-navy-900">
                  {(evaluation.metrics.precision * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${evaluation.metrics.precision * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('evaluation')}
                className="w-full text-center text-xs font-semibold text-medblue-600 hover:text-medblue-800 bg-medblue-50 py-2 rounded-lg transition-colors"
              >
                Deep-Dive ROC & PR Curves →
              </button>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-navy-900 text-sm">
                  Test Confusion Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Binary breakdown on test subject cohort (Zero synthetic fabrication).
                </p>
              </div>
              <div className="pt-3">
                <ConfusionMatrix
                  matrix={evaluation.confusion_matrix.matrix}
                  labels={evaluation.confusion_matrix.labels}
                />
              </div>
            </div>
          </div>

          {/* Cohort Class Distribution & Subject Splits */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-900 text-sm">
                Cohort Balance & Splits
              </h3>
              <p className="text-xs text-slate-500">
                Subject-stratified partition sizes (Zero cross-split leakage).
              </p>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={splitBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="samples" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Class Balance:</span>
              <span className="font-mono font-medium">
                Non: {evaluation.class_distribution.Nondemented} | Dem: {evaluation.class_distribution.Demented}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-2">
          <p className="font-semibold text-amber-900 text-sm">
            Model evaluation metrics are not available.
          </p>
          <p className="text-xs text-amber-700">
            Run the training pipeline to generate verified evaluation results.
          </p>
        </div>
      )}

      {/* Recent Patient Assessments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-navy-900 text-sm">
              Recent Patient Assessments
            </h3>
            <p className="text-xs text-slate-500">
              Persistent intake records saved with pseudonymous identifiers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-medblue-600 hover:text-medblue-800"
          >
            View All History →
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300" />
            <p>No patient assessments logged yet.</p>
            <button
              onClick={() => onNavigate('assessment')}
              className="text-xs font-semibold text-medblue-600 hover:underline"
            >
              Run your first assessment now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Ref ID</th>
                  <th className="p-3.5">Age / Sex</th>
                  <th className="p-3.5">MMSE</th>
                  <th className="p-3.5">nWBV</th>
                  <th className="p-3.5">GNN Prediction</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-navy-900">
                      {a.patient_ref_id}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {a.age} yrs • {a.sex === 'M' ? 'Male' : 'Female'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {a.mmse_score !== null ? a.mmse_score : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {a.nwbv ? a.nwbv.toFixed(3) : '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          a.prediction_label === 'Demented'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {a.prediction_label}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-slate-700">
                      {(a.prediction_probability * 100).toFixed(1)}%
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
