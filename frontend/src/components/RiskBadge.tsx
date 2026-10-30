import React from 'react';

interface RiskBadgeProps {
  level: string;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  const norm = (level || 'LOW').toUpperCase();
  
  let styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';

  if (norm === 'MEDIUM') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (norm === 'HIGH') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
    dotColor = 'bg-orange-500';
  } else if (norm === 'CRITICAL') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    dotColor = 'bg-rose-600 animate-pulse';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${styles} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
      {norm}
    </span>
  );
};
