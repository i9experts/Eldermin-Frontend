// ============================================================
// ASSESSMENT — MASTER SETTINGS: GRADING SCALES + PARENT VISIBILITY
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Settings as SettingsIcon, Eye, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  CURRICULUM_FRAMEWORKS, GradingBand, GradingScale, GradingScalePreset,
} from './types';
import {
  useGradingScalePresets, useGradingScales, useCreateGradingScale,
  useUpdateGradingScale, useDeleteGradingScale, useVisibilitySettings, useUpdateVisibilitySettings,
} from '../../hooks/useAssessments';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';

// ── Shared ────────────────────────────────────────────────────
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
  <select {...props} className={`w-full text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none truncate ${className || ''}`}>
    {children}
  </select>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${checked ? 'bg-[#1e3a5f]' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const frameworkLabel = (value: string) => CURRICULUM_FRAMEWORKS.find(f => f.value === value)?.label || value;

const emptyBand = (): GradingBand => ({ minPercent: 0, maxPercent: 100, label: '', gpaPoint: undefined, isPassing: true });

// ── Grading Scale editor (create or edit) ───────────────────────
const GradingScaleEditor: React.FC<{
  scale?: GradingScale;
  presets: GradingScalePreset[];
  existingFrameworks: string[];
  onClose: () => void;
}> = ({ scale, presets, existingFrameworks, onClose }) => {
  const isEdit = !!scale;
  const createScale = useCreateGradingScale();
  const updateScale = useUpdateGradingScale();
  const [framework, setFramework] = useState(scale?.framework || '');
  const [name, setName] = useState(scale?.name || '');
  const [bands, setBands] = useState<GradingBand[]>(scale?.bands?.length ? scale.bands : [emptyBand()]);
  const saving = createScale.isPending || updateScale.isPending;

  const applyPreset = (key: string) => {
    const preset = presets.find(p => p.key === key);
    if (!preset) return;
    setBands(preset.bands.map(b => ({ ...b })));
    if (!name) setName(preset.name);
  };

  const availableFrameworksForCreate = CURRICULUM_FRAMEWORKS.filter(f => !existingFrameworks.includes(f.value));

  const submit = () => {
    if (!framework) { toast.error('Select a curriculum framework'); return; }
    if (!name.trim()) { toast.error('Enter a name for this scale'); return; }
    const validBands = bands.filter(b => b.label.trim());
    if (validBands.length === 0) { toast.error('Add at least one grading band'); return; }

    const payload = { framework, name, bands: validBands };
    if (isEdit) {
      updateScale.mutate({ id: scale!._id, data: payload }, {
        onSuccess: () => { toast.success('Grading scale updated'); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update grading scale'),
      });
    } else {
      createScale.mutate(payload, {
        onSuccess: () => { toast.success('Grading scale created'); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create grading scale'),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Edit Grading Scale' : 'New Grading Scale'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">One scale per curriculum framework - already-published report cards never change retroactively.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Framework <span className="text-red-500">*</span></label>
              <Select value={framework} onChange={e => setFramework(e.target.value)} disabled={isEdit}>
                <option value="">Select Framework</option>
                {(isEdit ? CURRICULUM_FRAMEWORKS : availableFrameworksForCreate).map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Name <span className="text-red-500">*</span></label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IB 1-7 Scale" />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Start from a preset (optional)</label>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button key={p.key} type="button" onClick={() => applyPreset(p.key)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    <Sparkles size={11} className="text-amber-500" /> {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Grading Bands</label>
            </div>
            <div className="space-y-1.5">
              {bands.map((b, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-2">
                    <Input type="number" placeholder="Min %" value={b.minPercent}
                      onChange={e => setBands(prev => prev.map((x, j) => j === i ? { ...x, minPercent: +e.target.value } : x))} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Max %" value={b.maxPercent}
                      onChange={e => setBands(prev => prev.map((x, j) => j === i ? { ...x, maxPercent: +e.target.value } : x))} />
                  </div>
                  <div className="col-span-3">
                    <Input placeholder="Label (e.g. A-1, 7)" value={b.label}
                      onChange={e => setBands(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="GPA" value={b.gpaPoint ?? ''}
                      onChange={e => setBands(prev => prev.map((x, j) => j === i ? { ...x, gpaPoint: e.target.value === '' ? undefined : +e.target.value } : x))} />
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Toggle checked={b.isPassing !== false} onChange={v => setBands(prev => prev.map((x, j) => j === i ? { ...x, isPassing: v } : x))} />
                    <span className="text-[10px] text-gray-400">Pass</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setBands(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setBands(prev => [...prev, emptyBand()])}
              className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium hover:underline mt-2">
              <Plus size={12} /> Add Band
            </button>
          </div>
        </div>
        <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-5 py-2.5 rounded-lg font-medium">Cancel</button>
          <button onClick={submit} className="flex items-center gap-1.5 bg-[#1e3a5f] text-white hover:bg-[#16304f] text-xs px-5 py-2.5 rounded-lg font-medium">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Scale'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Grading Scales panel ─────────────────────────────────────────
const GradingScalesPanel: React.FC = () => {
  const { data: presets = [], isLoading: presetsLoading } = useGradingScalePresets();
  const { data: scales = [], isLoading: scalesLoading } = useGradingScales();
  const deleteScale = useDeleteGradingScale();
  const [editor, setEditor] = useState<{ open: boolean; scale?: GradingScale }>({ open: false });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const existingFrameworks = (scales as GradingScale[]).map(s => s.framework);

  const handleDelete = (id: string) => {
    deleteScale.mutate(id, {
      onSuccess: () => { toast.success('Grading scale deleted'); setConfirmDeleteId(null); },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete grading scale'),
    });
  };

  if (scalesLoading || presetsLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Grading Scales</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Define a grading scale per curriculum framework (IB, Cambridge, AKU-EB, Provincial boards, custom). Assign a framework to an assessment to use it.</p>
        </div>
        <button onClick={() => setEditor({ open: true })}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white hover:bg-[#16304f] text-xs px-3.5 py-2 rounded-lg font-medium">
          <Plus size={13} /> New Scale
        </button>
      </div>

      {(scales as GradingScale[]).length === 0 ? (
        <EmptyState icon={<SettingsIcon size={28} />} title="No grading scales configured yet" description="Assessments with no framework set keep using the default A+/A/B+/.../F scale." />
      ) : (
        <div className="divide-y divide-gray-50 mt-3">
          {(scales as GradingScale[]).map(scale => (
            <div key={scale._id} className="py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">{scale.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{frameworkLabel(scale.framework)}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {scale.bands.map((b, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">
                      {b.label}: {b.minPercent}-{b.maxPercent}%{b.gpaPoint !== undefined ? ` (${b.gpaPoint})` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditor({ open: true, scale })} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg"><Edit2 size={13} /></button>
                <button onClick={() => setConfirmDeleteId(scale._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor.open && (
        <GradingScaleEditor
          scale={editor.scale}
          presets={presets as GradingScalePreset[]}
          existingFrameworks={existingFrameworks}
          onClose={() => setEditor({ open: false })}
        />
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Delete this grading scale?</h3>
            <p className="text-xs text-gray-400 mb-4">Assessments using this framework will no longer be able to generate report cards until a new scale is configured. Already-published report cards are unaffected.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-4 py-2 rounded-lg font-medium">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="bg-red-500 text-white hover:bg-red-600 text-xs px-4 py-2 rounded-lg font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Parent Visibility panel ──────────────────────────────────────
const VISIBILITY_FIELDS: { key: 'shareGPA' | 'shareSubjectBreakdown' | 'shareClassPosition' | 'shareClassAverage'; label: string; description: string }[] = [
  { key: 'shareGPA', label: 'GPA', description: "Show the student's overall GPA on report cards in the parent app." },
  { key: 'shareSubjectBreakdown', label: 'Subject-wise Breakdown', description: 'Show per-subject marks, percentage and grade (plus teacher remarks).' },
  { key: 'shareClassPosition', label: 'Class Position / Rank', description: "Show where the student ranks among classmates. Off by default - most schools don't want this compared." },
  { key: 'shareClassAverage', label: 'Class Average', description: 'Show the average percentage of the whole class alongside the student\'s own score. Off by default.' },
];

const ParentVisibilityPanel: React.FC = () => {
  const { data: settings, isLoading } = useVisibilitySettings();
  const updateSettings = useUpdateVisibilitySettings();

  const handleToggle = (key: string, value: boolean) => {
    updateSettings.mutate({ [key]: value }, {
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update visibility setting'),
    });
  };

  if (isLoading) return <LoadingSkeleton rows={2} />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Eye size={15} className="text-[#1e3a5f]" />
        <h3 className="text-sm font-bold text-gray-800">Parent App Visibility</h3>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">Choose what report card information parents can see for their own child in the parent app. Analytics that compare students to each other (position, class average) are hidden by default.</p>
      <div className="divide-y divide-gray-50">
        {VISIBILITY_FIELDS.map(f => (
          <div key={f.key} className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-700">{f.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{f.description}</p>
            </div>
            <Toggle
              checked={!!(settings as any)?.[f.key]}
              disabled={updateSettings.isPending}
              onChange={(v) => handleToggle(f.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Settings tab (combined) ──────────────────────────────────────
export const MasterSettingsTab: React.FC = () => (
  <div className="space-y-4 max-w-4xl">
    <GradingScalesPanel />
    <ParentVisibilityPanel />
  </div>
);
