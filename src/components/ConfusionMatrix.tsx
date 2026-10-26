import React from 'react';

interface Props {
  matrix: number[][]; // 2x2
  labels: string[]; // ["Nondemented", "Demented"]
  className?: string;
}

export const ConfusionMatrix: React.FC<Props> = ({
  matrix,
  labels = ['Nondemented', 'Demented'],
  className = '',
}) => {
  if (!matrix || matrix.length < 2 || !matrix[0] || matrix[0].length < 2) {
    return (
      <div className="p-6 text-center text-slate-400 text-sm">
        Confusion matrix unavailable
      </div>
    );
  }

  const tn = matrix[0][0];
  const fp = matrix[0][1];
  const fn = matrix[1][0];
  const tp = matrix[1][1];

  const total = tn + fp + fn + tp;
  const actualNon = tn + fp;
  const actualDem = fn + tp;
  const predNon = tn + fn;
  const predDem = fp + tp;

  const sensitivity = actualDem > 0 ? (tp / actualDem) * 100 : 0;
  const specificity = actualNon > 0 ? (tn / actualNon) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs font-semibold text-slate-400"></th>
              <th className="p-2 text-xs font-semibold text-slate-400"></th>
              <th
                colSpan={2}
                className="p-2 text-xs font-bold text-navy-800 uppercase tracking-wider bg-slate-100 rounded-t-lg"
              >
                Predicted Diagnosis
              </th>
              <th className="p-2 text-xs font-semibold text-slate-400"></th>
            </tr>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="p-2"></th>
              <th className="p-2"></th>
              <th className="p-2 bg-slate-50">{labels[0]} (0)</th>
              <th className="p-2 bg-slate-50">{labels[1]} (1)</th>
              <th className="p-2 text-slate-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: Actual Nondemented */}
            <tr className="border-b border-slate-100">
              <th
                rowSpan={2}
                className="p-2 text-xs font-bold text-navy-800 uppercase tracking-wider bg-slate-100 rounded-l-lg [writing-mode:vertical-lr] rotate-180"
              >
                Actual
              </th>
              <th className="p-3 text-xs font-semibold text-slate-700 bg-slate-50 text-left">
                {labels[0]}
              </th>
              <td className="p-4 bg-emerald-50 text-emerald-900 border border-white">
                <div className="text-xl font-bold font-mono">{tn}</div>
                <div className="text-[10px] text-emerald-700 font-medium">True Neg (TN)</div>
              </td>
              <td className="p-4 bg-rose-50 text-rose-900 border border-white">
                <div className="text-xl font-bold font-mono">{fp}</div>
                <div className="text-[10px] text-rose-700 font-medium">False Pos (FP)</div>
              </td>
              <td className="p-3 text-xs font-mono font-medium text-slate-500 bg-slate-50">
                {actualNon}
              </td>
            </tr>

            {/* Row 2: Actual Demented */}
            <tr className="border-b border-slate-200">
              <th className="p-3 text-xs font-semibold text-slate-700 bg-slate-50 text-left">
                {labels[1]}
              </th>
              <td className="p-4 bg-rose-50 text-rose-900 border border-white">
                <div className="text-xl font-bold font-mono">{fn}</div>
                <div className="text-[10px] text-rose-700 font-medium">False Neg (FN)</div>
              </td>
              <td className="p-4 bg-emerald-50 text-emerald-900 border border-white">
                <div className="text-xl font-bold font-mono">{tp}</div>
                <div className="text-[10px] text-emerald-700 font-medium">True Pos (TP)</div>
              </td>
              <td className="p-3 text-xs font-mono font-medium text-slate-500 bg-slate-50">
                {actualDem}
              </td>
            </tr>

            {/* Total Row */}
            <tr className="text-xs font-medium text-slate-500 bg-slate-50">
              <th className="p-2"></th>
              <th className="p-2 text-slate-400 text-left">Total</th>
              <td className="p-2 font-mono">{predNon}</td>
              <td className="p-2 font-mono">{predDem}</td>
              <td className="p-2 font-mono font-bold text-navy-900">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-50 rounded-lg p-2.5 text-xs border border-slate-200 flex justify-between items-center">
          <span className="text-slate-600 font-medium">Sensitivity (Recall):</span>
          <span className="font-bold font-mono text-navy-900">{sensitivity.toFixed(1)}%</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 text-xs border border-slate-200 flex justify-between items-center">
          <span className="text-slate-600 font-medium">Specificity (TN Rate):</span>
          <span className="font-bold font-mono text-navy-900">{specificity.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
