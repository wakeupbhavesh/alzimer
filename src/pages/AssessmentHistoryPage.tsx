import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  Search,
  Filter,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import { AssessmentRecord, PageId, PredictionResponse } from '../types';

interface Props {
  onNavigate: (page: PageId) => void;
  onViewAssessment?: (result: PredictionResponse) => void;
}

export const AssessmentHistoryPage: React.FC<Props> = ({
  onNavigate,
  onViewAssessment,
}) => {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDiag, setFilterDiag] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getAssessments(100);
      setAssessments(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      setFeedbackMessage(`Assessment #${id} deleted successfully.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (assessments.length === 0) return;
    const headers = [
      'ID',
      'Patient Ref ID',
      'Age',
      'Sex',
      'Education',
      'SES',
      'MMSE',
      'eTIV',
      'nWBV',
      'ASF',
      'GNN Prediction',
      'Confidence',
      'Model Version',
      'Created At',
    ];
    const rows = assessments.map((a) => [
      a.id,
      a.patient_ref_id,
      a.age,
      a.sex,
      a.education_years,
      a.ses ?? '',
      a.mmse_score ?? '',
      a.etiv,
      a.nwbv,
      a.asf,
      a.prediction_label,
      a.prediction_probability,
      a.model_version,
      a.created_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NeuroGraph_Assessments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchSearch =
      a.patient_ref_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toString().includes(searchTerm);
    const matchDiag =
      filterDiag === 'all' || a.prediction_label.toLowerCase() === filterDiag.toLowerCase();
    return matchSearch && matchDiag;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Assessment History
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {assessments.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit log of clinical research intake sessions stored in local SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={assessments.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-medblue-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onNavigate('assessment')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-medblue-600 hover:bg-medblue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      <DisclaimerBanner variant="info" />

      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient Reference ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-medblue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterDiag}
            onChange={(e) => setFilterDiag(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Classifications</option>
            <option value="Nondemented">Nondemented</option>
            <option value="Demented">Demented</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-medblue-200 border-t-medblue-600 rounded-full animate-spin mx-auto mb-2" />
            Loading assessment records...
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-3">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-medium text-slate-600">No assessments match your criteria.</p>
            <button
              onClick={() => onNavigate('assessment')}
              className="text-xs font-semibold text-medblue-600 hover:underline"
            >
              Run an intake assessment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">ID</th>
                  <th className="p-3.5">Patient Ref</th>
                  <th className="p-3.5">Age / Sex</th>
                  <th className="p-3.5">MMSE</th>
                  <th className="p-3.5">nWBV</th>
                  <th className="p-3.5">GNN Prediction</th>
                  <th className="p-3.5">Confidence</th>
                  <th className="p-3.5">Recorded At</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">#{a.id}</td>
                    <td className="p-3.5 font-mono font-bold text-navy-900">
                      {a.patient_ref_id}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {a.age} yrs • {a.sex === 'M' ? 'M' : 'F'}
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
                      {new Date(a.created_at).toLocaleDateString()}{' '}
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right">
                      {deleteConfirmId === a.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-medium hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(a.id)}
                          title="Delete assessment"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
