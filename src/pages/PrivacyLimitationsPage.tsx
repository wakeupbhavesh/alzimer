import React from 'react';
import {
  ShieldAlert,
  Lock,
  FileText,
  AlertTriangle,
  UserCheck,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PageId } from '../types';

interface Props {
  onNavigate: (page: PageId) => void;
}

export const PrivacyLimitationsPage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Privacy Architecture & Research Limitations
          </h1>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Ethical AI Governance
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Technical safeguards, data minimization principles, and documented scientific boundaries of the NeuroGraph AI framework.
        </p>
      </div>

      <DisclaimerBanner variant="warning" />

      {/* Privacy Architecture */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-medblue-600" />
          <span>Data Privacy & Zero-PII Policy</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Pseudonymous Identifiers</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              No patient names, social security numbers, dates of birth, addresses, or phone numbers are accepted or stored. All records utilize synthetic or pseudonymous Reference IDs (e.g., <code>REF-8492</code>).
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Local Storage Avoidance</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clinical telemetry is never stored in browser local storage or persistent cookies by default. Data transmission occurs strictly over authenticated API endpoints.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Safe Database Access</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All intake records are stored in a parameterized local SQLite database via SQLAlchemy ORM, guarding against injection attacks and unvetted multi-tenant data exposure.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy-900 text-xs">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Audit Logging Without PII</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Application server logs record system latency, GNN tensor dimensions, and error traces without serializing clinical or demographic payloads.
            </p>
          </div>
        </div>
      </section>

      {/* Model Limitations & Scientific Boundaries */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <span>Scientific Boundaries & Machine Learning Limitations</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold text-xs uppercase tracking-wider text-amber-950">
              1. Non-Diagnostic Research Prototype
            </div>
            <p className="text-xs">
              NeuroGraph AI is an experimental computer science research prototype developed to study the topology of patient-similarity graph convolutions. It is <strong>NOT</strong> an FDA-cleared, CE-marked, or clinically validated medical device.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-xs uppercase tracking-wider text-navy-900">
              2. Probability Calibration Caveat
            </div>
            <p className="text-xs">
              Softmax outputs represent relative model discrimination on the constructed patient graph and must not be interpreted as clinically calibrated absolute disease risks without prospective Platt or isotonic calibration.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-xs uppercase tracking-wider text-navy-900">
              3. Cohort Specificity & Domain Generalization
            </div>
            <p className="text-xs">
              The model was trained and evaluated on the OASIS-2 cohort (older adults predominantly from North American demographics). Predictions on patients with severe neurological comorbidities, traumatic brain injuries, or disparate clinical profiles may suffer out-of-distribution performance degradation.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-xs uppercase tracking-wider text-navy-900">
              4. Data-Leakage Countermeasures
            </div>
            <p className="text-xs">
              Clinical Dementia Rating (CDR) scores are strictly withheld from model input features because CDR $\ge 0.5$ defines clinical dementia. The model relies solely on objective demographics, MMSE, and stereotaxic MRI volumetric ratios.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
