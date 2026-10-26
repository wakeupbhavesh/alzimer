import React from 'react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'medblue' | 'amber' | 'slate';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  badge,
  badgeColor = 'medblue',
  icon: Icon,
  className = '',
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-100 text-emerald-800',
    medblue: 'bg-medblue-100 text-medblue-800',
    amber: 'bg-amber-100 text-amber-800',
    slate: 'bg-slate-100 text-slate-700',
  }[badgeColor];

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-medblue-50 flex items-center justify-center text-medblue-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-extrabold text-navy-900 tracking-tight font-mono">
          {value}
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
      )}
    </div>
  );
};
