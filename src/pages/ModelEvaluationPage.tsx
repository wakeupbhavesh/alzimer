import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import { EvaluationResponse, ModelInfoResponse, PageId } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface Props {
  onNavigate: (page: PageId) => void;
}

export const ModelEvaluationPage: React.FC<Props> = ({ onNavigate }) => {
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [e, m] = await Promise.all([
          api.getEvaluation(),
          api.getModelInfo(),
        ]);
        setEvaluation(e);
        setModelInfo(m);
      } catch (err: any) {
        setError(err.message || 'Failed to load evaluation metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-medblue-200 border-t-medblue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Retrieving held-out test evaluation benchmarks...</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">Evaluation Benchmark Unavailable</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          {error || 'Model has not yet executed held-out test evaluation.'}
        </p>
      </div>
    );
  }

  // Format ROC curve data
  const rocCurveData = evaluation.roc_curve
    ? evaluation.roc_curve.fpr.map((fprVal, idx) => ({
        fpr: Number((fprVal * 100).toFixed(1)),
        tpr: Number(((evaluation.roc_curve?.tpr[idx] ?? 0) * 100).toFixed(1)),
        baseline: Number((fprVal * 100).toFixed(1)),
      }))
    : [];

  // Format Training loss & accuracy history
  const historyData = evaluation.training_history?.train_loss
    ? evaluation.training_history.train_loss.map((lossVal, idx) => ({
        epoch: idx + 1,
        train_loss: lossVal,
        val_loss: evaluation.training_history?.val_loss[idx] ?? null,
        train_acc: evaluation.training_history?.train_acc
          ? Number((evaluation.training_history.train_acc[idx] * 100).toFixed(1))
          : null,
        val_acc: evaluation.training_history?.val_acc
          ? Number((evaluation.training_history.val_acc[idx] * 100).toFixed(1))
          : null,
      }))
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Held-Out Model Evaluation
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified Real Benchmark
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Empirical evaluation results on 58 unseen test scans across independent subjects (Subject-Stratified Split).
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          Last Evaluation: {new Date(evaluation.evaluation_timestamp).toLocaleDateString()}
        </div>
      </div>

      <DisclaimerBanner variant="info" />

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Accuracy"
          value={`${(evaluation.metrics.accuracy * 100).toFixed(2)}%`}
          subtitle="Test Partition Accuracy"
          badge="Held-Out"
          badgeColor="emerald"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Macro F1-Score"
          value={`${(evaluation.metrics.f1_score * 100).toFixed(2)}%`}
          subtitle="Harmonic Mean Prec/Rec"
          badge="Balanced"
          badgeColor="medblue"
          icon={TrendingUp}
        />
        <MetricCard
          title="Sensitivity (Recall)"
          value={`${(evaluation.metrics.recall * 100).toFixed(2)}%`}
          subtitle="True Dementia Detection Rate"
          badge="High"
          badgeColor="emerald"
          icon={BarChart3}
        />
        <MetricCard
          title="ROC-AUC"
          value={evaluation.metrics.roc_auc.toFixed(4)}
          subtitle="Area Under ROC Curve"
          badge="Discriminative"
          badgeColor="emerald"
          icon={LineChartIcon}
        />
      </div>

      {/* ROC Curve and Confusion Matrix Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">
                Receiver Operating Characteristic (ROC-AUC)
              </h3>
              <p className="text-xs text-slate-500">
                True Positive Rate vs. False Positive Rate across decision thresholds.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-medblue-50 text-medblue-700 px-2 py-0.5 rounded">
              AUC: {evaluation.metrics.roc_auc.toFixed(4)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCurveData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="fpr"
                  unit="%"
                  label={{ value: 'False Positive Rate (%)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  unit="%"
                  label={{ value: 'True Positive Rate (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  name="GAT Model ROC"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="linear"
                  dataKey="baseline"
                  name="Chance Baseline"
                  stroke="#cbd5e1"
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-navy-900 text-sm">
                  Held-Out Confusion Matrix Heatmap
                </h3>
                <p className="text-xs text-slate-500">
                  Exact true/false classifications on {evaluation.test_samples} unseen test scans.
                </p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                Test Set: N={evaluation.test_samples}
              </span>
            </div>
            <div className="pt-4">
              <ConfusionMatrix
                matrix={evaluation.confusion_matrix.matrix}
                labels={evaluation.confusion_matrix.labels}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Training History Curves */}
      {historyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loss Curve */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-900 text-sm">
                Training & Validation Loss History
              </h3>
              <p className="text-xs text-slate-500">
                Cross-entropy loss with early stopping on validation loss plateau.
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 10 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#64748b" dot={false} />
                  <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#0284c7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracy Curve */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-navy-900 text-sm">
                Training & Validation Accuracy History
              </h3>
              <p className="text-xs text-slate-500">
                Node classification accuracy per epoch across subject partitions.
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 10 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="train_acc" name="Train Accuracy" stroke="#94a3b8" dot={false} />
                  <Line type="monotone" dataKey="val_acc" name="Val Accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Model & Dataset Governance Specification */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-navy-900 text-sm flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-medblue-600" />
          <span>Research Model & Dataset Governance</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Model Architecture:</span>
            <div className="font-semibold text-navy-900 mt-1">PyTorch Geometric GAT</div>
            <div className="text-[10px] text-slate-500">2-Layer GATConv (4 heads, BN, ELU)</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Dataset Benchmark:</span>
            <div className="font-semibold text-navy-900 mt-1">OASIS-2 Longitudinal MRI</div>
            <div className="text-[10px] text-slate-500">373 MRI scans across 150 subjects</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Data Partitioning:</span>
            <div className="font-semibold text-navy-900 mt-1">Subject-Level Split (70/15/15)</div>
            <div className="text-[10px] text-slate-500">Strictly zero patient overlap across splits</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-slate-400 font-medium">Leakage Prevention:</span>
            <div className="font-semibold text-navy-900 mt-1">CDR Excluded From Inputs</div>
            <div className="text-[10px] text-slate-500">Preprocessors fitted strictly on train set</div>
          </div>
        </div>
      </div>
    </div>
  );
};
