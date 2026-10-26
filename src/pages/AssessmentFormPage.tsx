import React, { useState } from 'react';
import {
  FileText,
  Send,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Info,
  CheckCircle2,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api } from '../services/api';
import { PatientAssessmentInput, PredictionResponse, PageId } from '../types';

interface Props {
  onPredictionSuccess: (result: PredictionResponse) => void;
  onNavigate: (page: PageId) => void;
}

export const AssessmentFormPage: React.FC<Props> = ({
  onPredictionSuccess,
  onNavigate,
}) => {
  const [formData, setFormData] = useState<PatientAssessmentInput>({
    patient_ref_id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    age: 72,
    sex: 'F',
    education_years: 14,
    ses: 2,
    mmse_score: 28,
    etiv: 1540,
    nwbv: 0.74,
    asf: 1.14,
    family_history: 'None reported',
    hypertension_history: 'No',
    diabetes_history: 'No',
    smoking_status: 'Never',
    physical_activity: 'Moderate (2-3 hrs/wk)',
    moca_score: 27,
    clinical_dementia_rating: 0,
    memory_assessment_score: 85,
    apoe_e4_status: 'Non-carrier (e3/e3)',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: keyof PatientAssessmentInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumericChange = (field: keyof PatientAssessmentInput, rawValue: string) => {
    if (rawValue.trim() === '') {
      handleChange(field, null);
    } else {
      const parsed = parseFloat(rawValue);
      handleChange(field, isNaN(parsed) ? null : parsed);
    }
  };

  // Quick Clinical Presets
  const loadPreset = (presetType: 'healthy' | 'mci' | 'demented') => {
    const randomId = `REF-${Math.floor(1000 + Math.random() * 9000)}`;
    if (presetType === 'healthy') {
      setFormData({
        patient_ref_id: randomId,
        age: 71,
        sex: 'F',
        education_years: 16,
        ses: 2,
        mmse_score: 29,
        etiv: 1560,
        nwbv: 0.78,
        asf: 1.12,
        family_history: 'None reported',
        hypertension_history: 'No',
        diabetes_history: 'No',
        smoking_status: 'Never',
        physical_activity: 'Active (3+ hrs/wk)',
        moca_score: 28,
        clinical_dementia_rating: 0,
        memory_assessment_score: 92,
        apoe_e4_status: 'Non-carrier (e3/e3)',
      });
    } else if (presetType === 'mci') {
      setFormData({
        patient_ref_id: randomId,
        age: 76,
        sex: 'M',
        education_years: 14,
        ses: 3,
        mmse_score: 24,
        etiv: 1610,
        nwbv: 0.71,
        asf: 1.08,
        family_history: 'Paternal Alzheimer history',
        hypertension_history: 'Stage 1 managed with ACE inhibitor',
        diabetes_history: 'No',
        smoking_status: 'Former smoker (quit >10 yrs)',
        physical_activity: 'Light (<1 hr/wk)',
        moca_score: 22,
        clinical_dementia_rating: 0.5,
        memory_assessment_score: 68,
        apoe_e4_status: 'Heterozygous (e3/e4)',
      });
    } else {
      setFormData({
        patient_ref_id: randomId,
        age: 82,
        sex: 'F',
        education_years: 12,
        ses: 3,
        mmse_score: 19,
        etiv: 1480,
        nwbv: 0.66,
        asf: 1.18,
        family_history: 'Multiple maternal family members with dementia',
        hypertension_history: 'Hypertension under treatment',
        diabetes_history: 'Type 2 managed',
        smoking_status: 'Former smoker',
        physical_activity: 'Sedentary',
        moca_score: 16,
        clinical_dementia_rating: 1.0,
        memory_assessment_score: 42,
        apoe_e4_status: 'Homozygous (e4/e4)',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.patient_ref_id || formData.patient_ref_id.trim().length < 2) {
      setErrorMessage('Please enter a valid Patient Reference Identifier.');
      return;
    }
    if (formData.age < 45 || formData.age > 105) {
      setErrorMessage('Age must be between 45 and 105 years.');
      return;
    }
    if (formData.mmse_score !== null && formData.mmse_score !== undefined) {
      if (formData.mmse_score < 0 || formData.mmse_score > 30) {
        setErrorMessage('MMSE score must be within range 0 to 30.');
        return;
      }
    }
    if (formData.nwbv < 0.55 || formData.nwbv > 0.90) {
      setErrorMessage('Normalized Whole Brain Volume (nWBV) must be between 0.55 and 0.90.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await api.predict(formData);
      onPredictionSuccess(result);
      onNavigate('results');
    } catch (err: any) {
      setErrorMessage(err.message || 'Prediction service failed. Ensure the GNN backend is active.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Patient Assessment Intake
          </h1>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-medblue-100 text-medblue-800">
            GNN Graph Embedding
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Input demographic, cognitive, and volumetric biomarker telemetry. Unseen patients are embedded inductively via local graph message passing.
        </p>
      </div>

      <DisclaimerBanner variant="warning" />

      {/* Preset Buttons Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Sparkles className="w-4 h-4 text-medblue-600" />
          <span>Quick Benchmark Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('healthy')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            Cohort Normal (MMSE 29)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('mci')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            Mild Cognitive Decline (MMSE 24)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('demented')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            Moderate Dementia Profile (MMSE 19)
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Assessment Submission Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identifier & Demographics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-navy-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-medblue-600" />
              <span>1. Identification & Demographics</span>
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-semibold">
              Zero PII Protocol
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Patient Reference ID *
              </label>
              <input
                type="text"
                value={formData.patient_ref_id}
                onChange={(e) => handleChange('patient_ref_id', e.target.value)}
                placeholder="e.g. REF-2026-01"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400">Pseudonymous unique token</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Age (years) *
              </label>
              <input
                type="number"
                min={45}
                max={105}
                step={1}
                value={formData.age}
                onChange={(e) => handleNumericChange('age', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400">Cohort range: 45 - 105</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Biological Sex *
              </label>
              <select
                value={formData.sex}
                onChange={(e) => handleChange('sex', e.target.value as 'M' | 'F')}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
              >
                <option value="F">Female (F)</option>
                <option value="M">Male (M)</option>
              </select>
              <span className="text-[10px] text-slate-400">Encodes node attribute</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Education (Years) *
              </label>
              <input
                type="number"
                min={1}
                max={28}
                step={1}
                value={formData.education_years}
                onChange={(e) => handleNumericChange('education_years', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400">Formal years (EDUC)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Socioeconomic Status (SES)
                <span className="ml-1 text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={formData.ses ?? ''}
                onChange={(e) =>
                  handleChange('ses', e.target.value === '' ? null : parseFloat(e.target.value))
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
              >
                <option value="">Leave Empty (Median Imputed)</option>
                <option value="1">1 - Highest Professional</option>
                <option value="2">2 - Technical / Managerial</option>
                <option value="3">3 - Skilled / Administrative</option>
                <option value="4">4 - Semi-skilled</option>
                <option value="5">5 - Unskilled Labor</option>
              </select>
              <span className="text-[10px] text-slate-400">Hollingshead Index (1-5)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Cognitive Testing & Biomarkers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-navy-900 text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-medblue-600" />
              <span>2. Cognitive Screening & Neuroimaging Measures</span>
            </h2>
            <span className="text-[10px] bg-medblue-100 text-medblue-800 px-2 py-0.5 rounded font-mono font-semibold">
              Primary GNN Vector
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                MMSE Score (0 - 30)
                <span className="ml-1 text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={formData.mmse_score ?? ''}
                onChange={(e) => handleNumericChange('mmse_score', e.target.value)}
                placeholder="e.g. 27"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">
                &ge;24 normal; &lt;24 cognitive deficit
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                eTIV (mm&sup3;) *
              </label>
              <input
                type="number"
                min={900}
                max={2400}
                step={1}
                value={formData.etiv}
                onChange={(e) => handleNumericChange('etiv', e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400">
                Estimated Intracranial Volume (1100-2100)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                nWBV (Ratio) *
              </label>
              <input
                type="number"
                min={0.55}
                max={0.90}
                step={0.001}
                value={formData.nwbv}
                onChange={(e) => handleNumericChange('nwbv', e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400">
                Normalized Whole Brain Volume (0.64-0.84)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                ASF (Atlas Scaling) *
              </label>
              <input
                type="number"
                min={0.70}
                max={1.80}
                step={0.001}
                value={formData.asf}
                onChange={(e) => handleNumericChange('asf', e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-medblue-500 focus:outline-hidden"
                required
              />
              <span className="text-[10px] text-slate-400">
                Stereotaxic Scaling Factor (0.87-1.58)
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Extended Research Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>3. Extended Clinical Telemetry</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-normal">
                  Recorded in Assessment Database
                </span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Family History
              </label>
              <input
                type="text"
                value={formData.family_history || ''}
                onChange={(e) => handleChange('family_history', e.target.value)}
                placeholder="e.g. None / Maternal AD"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hypertension History
              </label>
              <input
                type="text"
                value={formData.hypertension_history || ''}
                onChange={(e) => handleChange('hypertension_history', e.target.value)}
                placeholder="e.g. Controlled / None"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Smoking Status
              </label>
              <select
                value={formData.smoking_status || 'Never'}
                onChange={(e) => handleChange('smoking_status', e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              >
                <option value="Never">Never</option>
                <option value="Former">Former smoker</option>
                <option value="Current">Current smoker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MoCA Score (0 - 30)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={formData.moca_score ?? ''}
                onChange={(e) => handleNumericChange('moca_score', e.target.value)}
                placeholder="Optional"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CDR (Reference Anchor)
              </label>
              <select
                value={formData.clinical_dementia_rating ?? ''}
                onChange={(e) =>
                  handleChange(
                    'clinical_dementia_rating',
                    e.target.value === '' ? null : parseFloat(e.target.value)
                  )
                }
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              >
                <option value="">Unknown / None</option>
                <option value="0">0.0 (Normal)</option>
                <option value="0.5">0.5 (Very Mild)</option>
                <option value="1">1.0 (Mild Dementia)</option>
                <option value="2">2.0 (Moderate Dementia)</option>
              </select>
              <span className="text-[10px] text-amber-600 font-medium">
                Held-out during training to avoid leakage
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                APOE &epsilon;4 Status
              </label>
              <input
                type="text"
                value={formData.apoe_e4_status || ''}
                onChange={(e) => handleChange('apoe_e4_status', e.target.value)}
                placeholder="e.g. Non-carrier, Heterozygous"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-medblue-600 hover:bg-medblue-700 disabled:bg-slate-400 text-white text-xs font-semibold shadow-md shadow-medblue-200 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Running Inductive GNN Message Passing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Execute GNN Prediction & Topological Inference</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
