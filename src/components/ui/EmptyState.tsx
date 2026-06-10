import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-gray-300">{icon}</div>}
    <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>
    {description && <p className="text-xs text-gray-400 max-w-xs mb-4">{description}</p>}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium mt-2"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Could not load data', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <AlertCircle size={32} className="text-red-400 mb-3" />
    <h3 className="text-sm font-semibold text-red-600 mb-1">Something went wrong</h3>
    <p className="text-xs text-gray-400 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg hover:bg-gray-50 font-medium"
      >
        <RefreshCw size={12} /> Try Again
      </button>
    )}
  </div>
);
