import React from 'react';

export const CALENDAR_EVENT_TYPES = [
  'holiday', 'exam', 'event', 'admission_deadline', 'training', 'half_day', 'public_holiday', 'other',
];
export const CALENDAR_EVENT_COLORS: Record<string, string> = {
  holiday: '#E24B4A',
  exam: '#7F77DD',
  event: '#1D9E75',
  fee_due: '#EF9F27',
  admission_deadline: '#378ADD',
  training: '#BA7517',
  half_day: '#888888',
  public_holiday: '#D85A30',
  other: '#0C447C',
  // Synced-only (Assessments/Academics), never a manually selectable type.
  academic_term: '#008300',
};
export const CIRCULAR_CATEGORIES = ['academic', 'administrative', 'fee', 'emergency', 'sports', 'cultural', 'other'];

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}>{children}</div>
);

export const CardHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
    <div>
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

export const Btn = ({
  variant = 'primary', size = 'md', children, onClick, className = '', disabled, type = 'button',
}: {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'xs';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const v = {
    primary: 'bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
  };
  const s = { xs: 'px-2 py-1 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${v[variant]} ${s[size]} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export const Modal = ({
  title, onClose, children, footer, wide,
}: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} my-4`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="font-bold text-slate-900">{title}</div>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
      </div>
      <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">{children}</div>
      {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">{footer}</div>}
    </div>
  </div>
);

export const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent';

export const FInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
);
export const FTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`${inputCls} resize-vertical ${props.className ?? ''}`} />
);
export const FSelect = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`${inputCls} bg-white ${props.className ?? ''}`}>{children}</select>
);

const STATUS_MAP: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-500 border-slate-200',
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  normal: 'bg-slate-100 text-slate-500 border-slate-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};
export const Badge = ({ status, small }: { status: string; small?: boolean }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium capitalize ${small ? 'text-xs' : 'text-xs'} ${STATUS_MAP[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
    {status?.replace(/-/g, ' ').replace(/_/g, ' ')}
  </span>
);

export const EmptyState = ({ icon = '📅', title, action }: { icon?: string; title: string; action?: React.ReactNode }) => (
  <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-lg">
    <div className="text-4xl mb-2">{icon}</div>
    <div className="font-medium text-slate-600 mb-3">{title}</div>
    {action}
  </div>
);
