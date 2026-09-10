import React from 'react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const BOOK_CATEGORIES = ['textbook', 'islamic', 'fiction', 'reference', 'science', 'biography', 'children', 'periodical', 'non_fiction', 'other'];

// ─── UI PRIMITIVES (matches src/pages/governance/shared.tsx visual language) ──

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
    <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} my-4`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="font-bold text-slate-900">{title}</div>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">✕</button>
      </div>
      <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">{children}</div>
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

export const TableWrap = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          {headers.map((h) => (
            <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`py-2.5 px-4 text-slate-700 ${className}`}>{children}</td>
);

const STATUS_MAP: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  issued: 'bg-blue-50 text-blue-700 border-blue-200',
  returned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  lost: 'bg-slate-800 text-slate-100 border-slate-700',
  damaged: 'bg-amber-50 text-amber-700 border-amber-200',
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  // Matches the real Reservation.status enum on the backend ('ready', not
  // 'ready-for-pickup') - see reservation.schema.ts.
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  deaccessioned: 'bg-slate-100 text-slate-500 border-slate-200',
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fair: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const Badge = ({ status, small }: { status: string; small?: boolean }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium capitalize ${small ? 'text-xs' : 'text-xs'} ${STATUS_MAP[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
    {status?.replace(/-/g, ' ').replace(/_/g, ' ')}
  </span>
);

export const Pager = ({
  page, pages, total, onPageChange,
}: { page: number; pages: number; total: number; onPageChange: (p: number) => void }) => (
  <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between flex-wrap gap-3">
    <span className="text-xs text-slate-400">{total} total</span>
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
        className="px-2.5 py-1 text-xs rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200">
        Prev
      </button>
      <span className="text-xs text-slate-500 px-2">Page {page} of {Math.max(pages, 1)}</span>
      <button onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages}
        className="px-2.5 py-1 text-xs rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200">
        Next
      </button>
    </div>
  </div>
);

export const EmptyState = ({ icon = '📚', title, action }: { icon?: string; title: string; action?: React.ReactNode }) => (
  <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-lg">
    <div className="text-4xl mb-2">{icon}</div>
    <div className="font-medium text-slate-600 mb-3">{title}</div>
    {action}
  </div>
);
