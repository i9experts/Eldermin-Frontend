// ============================================================
// MODULE HEADER — shared top-of-page header for all 12
// top-level ERP modules (Institution, Governance, Documents,
// HR, Teaching, Finance, Procurement, Admissions, Students,
// Assessment, Behaviour, Analytics).
//
// This is the single canonical header style for the app,
// synthesized from the "gray/gradient-icon/underline" variant
// that Admissions, Assessment and Behaviour already used (the
// most complete visual language: icon box + title + subtitle +
// actions) — every module now renders through this component
// instead of hand-rolled, per-module markup.
// ============================================================

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ModuleHeaderProps {
  /** Lucide icon component (not an already-rendered element) shown in the accent icon box. */
  icon: LucideIcon;
  /** Module title, e.g. "Admission Lifecycle". */
  title: string;
  /** Optional one-line description shown under the title. */
  subtitle?: string;
  /**
   * Right-aligned slot for buttons, filters, dropdowns, or any other
   * controls (e.g. Analytics' academic-year picker). Rendered as-is in a
   * flex row, so callers are free to mix arbitrary controls in here.
   */
  actions?: React.ReactNode;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ icon: Icon, title, subtitle, actions }) => {
  return (
    <div className="bg-white px-6 pt-5 pb-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-[#1e3a5f] to-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleHeader;
