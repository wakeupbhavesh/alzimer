import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface Props {
  variant?: 'warning' | 'info';
  className?: string;
}

export const DisclaimerBanner: React.FC<Props> = ({ variant = 'warning', className = '' }) => {
  if (variant === 'info') {
    return (
      <div className={`bg-medblue-50 border border-medblue-200 rounded-lg p-3 text-sm text-navy-700 flex items-start gap-2.5 ${className}`}>
        <Info className="w-5 h-5 text-medblue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-medblue-900">Academic Research Prototype: </span>
          Models trained on the OASIS-2 longitudinal MRI benchmark for topological disease modeling. Held-out subject splitting applied to prevent data leakage.
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs md:text-sm text-amber-900 flex items-start gap-2.5 ${className}`}>
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-amber-950">Clinical Disclaimer: </span>
        This academic research prototype is not a medical diagnostic tool. Predictions are experimental and must not be used to make medical decisions. Consult a qualified healthcare professional for clinical evaluation.
      </div>
    </div>
  );
};
