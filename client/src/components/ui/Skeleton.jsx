import React from 'react';

export const Skeleton = ({ className = '', count = 1 }) => {
  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />;
};

export default Skeleton;

