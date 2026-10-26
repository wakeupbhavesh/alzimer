import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssessmentFormPage } from './pages/AssessmentFormPage';
import { PredictionResultPage } from './pages/PredictionResultPage';
import { GraphExplorerPage } from './pages/GraphExplorerPage';
import { AssessmentHistoryPage } from './pages/AssessmentHistoryPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { PrivacyLimitationsPage } from './pages/PrivacyLimitationsPage';
import { api } from './services/api';
import { PageId, HealthResponse, PredictionResponse } from './types';
import { Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('landing');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    // Initial health check
    api.getHealth()
      .then(setHealth)
      .catch((err) => {
        console.warn('Backend not currently reachable:', err);
        setHealth({
          status: 'connecting',
          model_available: false,
          dataset_available: false,
          model_version: null,
          environment: 'offline',
        });
      });
  }, []);

  const handlePredictionSuccess = (result: PredictionResponse) => {
    setLatestPrediction(result);
    setCurrentPage('results');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-navy-800">
      {/* Top Navbar */}
      <Navbar
        health={health}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNavigateLanding={() => setCurrentPage('landing')}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {currentPage === 'landing' && (
            <LandingPage onNavigate={setCurrentPage} health={health} />
          )}
          {currentPage === 'dashboard' && (
            <DashboardPage onNavigate={setCurrentPage} />
          )}
          {currentPage === 'assessment' && (
            <AssessmentFormPage
              onPredictionSuccess={handlePredictionSuccess}
              onNavigate={setCurrentPage}
            />
          )}
          {currentPage === 'results' && (
            <PredictionResultPage
              result={latestPrediction}
              onNavigate={setCurrentPage}
            />
          )}
          {currentPage === 'graph-explorer' && (
            <GraphExplorerPage onNavigate={setCurrentPage} />
          )}
          {currentPage === 'history' && (
            <AssessmentHistoryPage onNavigate={setCurrentPage} />
          )}
          {currentPage === 'evaluation' && (
            <ModelEvaluationPage onNavigate={setCurrentPage} />
          )}
          {currentPage === 'about' && (
            <AboutProjectPage onNavigate={setCurrentPage} />
          )}
          {currentPage === 'privacy' && (
            <PrivacyLimitationsPage onNavigate={setCurrentPage} />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-navy-900">
            <Activity className="w-4 h-4 text-medblue-600" />
            <span>NeuroGraph AI</span>
            <span className="text-[11px] font-normal text-slate-400">
              • Academic Research Prototype
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Experimental non-diagnostic prototype. Built with PyTorch Geometric, FastAPI, React & Cytoscape.js.
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
