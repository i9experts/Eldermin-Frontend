import React from 'react';
import { X } from 'lucide-react';

export const Modal: React.FC<{ title: string; subtitle?: string; onClose: () => void; size?: 'sm'|'md'|'lg'|'xl'; footer?: React.ReactNode; children: React.ReactNode }> =
  ({ title, subtitle, onClose, size = 'lg', footer, children }) => {
    const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full ${w} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <div className="border-t border-gray-100 p-4 flex justify-end gap-3">{footer}</div>}
        </div>
      </div>
    );
  };

export const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700" />
);
export const Sel: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...p }) => (
  <select {...p} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-gray-600">{children}</select>
);

type BtnProps = { onClick?: () => void; icon?: React.ReactNode; children: React.ReactNode; disabled?: boolean };
export const BtnPrimary: React.FC<BtnProps> = ({ onClick, icon, children, disabled }) => (
  <button onClick={onClick} disabled={disabled} className="flex items-center gap-1.5 bg-[#1e3a5f] text-white hover:bg-[#16304f] transition-colors text-xs px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
    {icon}{children}
  </button>
);
export const BtnSecondary: React.FC<BtnProps> = ({ onClick, children }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-5 py-2.5 rounded-lg font-medium">
    {children}
  </button>
);
