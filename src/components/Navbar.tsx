import React from 'react';
import { Activity, ShieldCheck, Database, Menu, X, Cpu } from 'lucide-react';
import { HealthResponse } from '../types';

interface Props {
  health: HealthResponse | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onNavigateLanding: () => void;
}

export const Navbar: React.FC<Props> = ({
  health,
  sidebarOpen,
  setSidebarOpen,
  onNavigateLanding,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={onNavigateLanding}
            className="flex items-center gap-2.5 text-left group transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medblue-700 to-medblue-500 flex items-center justify-center text-white shadow-md shadow-medblue-200">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-navy-900 flex items-center gap-1.5">
                NeuroGraph <span className="text-medblue-600">AI</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium tracking-wide">
                GNN Alzheimer's Prediction Platform
              </div>
            </div>
          </button>
        </div>

        {/* System Health Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>OASIS-2 Dataset</span>
            <span className={`w-2 h-2 rounded-full ${health?.dataset_available ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              health?.model_available
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{health?.model_available ? 'PyG GAT Operational' : 'Model Loading/Unavailable'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                health?.model_available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500 pl-2 border-l border-slate-200">
            <ShieldCheck className="w-4 h-4 text-medblue-600" />
            <span>Zero PII Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
};
