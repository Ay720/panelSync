import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',

    // Specific status badges
    scheduled: 'bg-purple-50 text-purple-700 border-purple-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    applied: 'bg-slate-100 text-slate-700 border-slate-200',
    screening: 'bg-sky-50 text-sky-700 border-sky-200',
    offered: 'bg-teal-50 text-teal-700 border-teal-200',
    rejected: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 leading-none',
    sm: 'text-xs px-2.5 py-0.5 leading-tight',
    md: 'text-sm px-3 py-1 leading-normal',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

