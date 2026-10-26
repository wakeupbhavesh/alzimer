import React from 'react';
import {
  Home,
  LayoutDashboard,
  FileSpreadsheet,
  CheckCircle2,
  Share2,
  History,
  BarChart3,
  BookOpen,
  ShieldAlert,
} from 'lucide-react';
import { PageId } from '../types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'landing', label: 'Overview', icon: Home },
  { id: 'dashboard', label: 'Research Dashboard', icon: LayoutDashboard },
  { id: 'assessment', label: 'Patient Assessment', icon: FileSpreadsheet, badge: 'Intake' },
  { id: 'results', label: 'Prediction Results', icon: CheckCircle2 },
  { id: 'graph-explorer', label: 'Graph Explorer', icon: Share2, badge: 'GNN' },
  { id: 'history', label: 'Assessment History', icon: History },
  { id: 'evaluation', label: 'Model Evaluation', icon: BarChart3, badge: 'OASIS' },
  { id: 'about', label: 'About Project', icon: BookOpen },
  { id: 'privacy', label: 'Privacy & Limitations', icon: ShieldAlert },
];

interface Props {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy-900/40 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-medblue-50 text-medblue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-medblue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-medblue-200 text-medblue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500">
          <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
            <span>Graph Attention Network</span>
            <span className="text-[10px] bg-medblue-100 text-medblue-700 px-1.5 py-0.2 rounded font-mono">
              v1.0.0
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Inductive Patient-Similarity Graph convolution using PyTorch Geometric.
          </p>
        </div>
      </aside>
    </>
  );
};
