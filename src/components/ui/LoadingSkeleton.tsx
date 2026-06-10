import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'stats' | 'table' | 'cards' | 'default';
  rows?: number;
}

const Pulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'default', rows = 4 }) => {
  if (variant === 'stats') return (
    <div className="space-y-4">
      <Pulse className="h-20 w-full" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Pulse key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Pulse key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Pulse key={i} className="h-52" />)}
      </div>
    </div>
  );

  if (variant === 'table') return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <Pulse className="h-10 w-full rounded-none rounded-t-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
          <Pulse className="h-4 w-1/4" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-1/3" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-12" />
          <Pulse className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  );

  if (variant === 'cards') return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Pulse key={i} className="h-48" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Pulse key={i} className="h-16 w-full" />
      ))}
    </div>
  );
};
