// ============================================================
// QAIDA/NAZRA SETTINGS MODAL — invigilator KPIs + Nazra order
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================
// Shared by both QaidaTab and NazraTab (one settings doc covers both
// programs) - see eldermin-backend's QaidaNazraSettings.

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, X, Plus, Trash2 } from 'lucide-react';
import { useQaidaNazraSettings, useUpdateQaidaNazraSettings } from '../../hooks/useQaidaNazraExtras';
import type { InvigilatorKpi } from '../../services/qaidaNazraExtras.api';

export const QaidaNazraSettingsButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 font-medium">
        <Settings size={13} /> Qaida/Nazra Settings
      </button>
      {open && <QaidaNazraSettingsModal onClose={() => setOpen(false)} />}
    </>
  );
};

const QaidaNazraSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: settings, isLoading } = useQaidaNazraSettings();
  const updateMutation = useUpdateQaidaNazraSettings();

  const [reverseOrder, setReverseOrder] = useState(false);
  const [kpis, setKpis] = useState<InvigilatorKpi[]>([]);

  useEffect(() => {
    if (settings) {
      setReverseOrder(!!settings.nazraReverseOrder);
      setKpis(settings.invigilatorKpis || []);
    }
  }, [settings]);

  const addKpi = () => setKpis(prev => [...prev, { key: '', label: '' }]);
  const removeKpi = (i: number) => setKpis(prev => prev.filter((_, idx) => idx !== i));
  const updateKpi = (i: number, field: keyof InvigilatorKpi, value: string) =>
    setKpis(prev => prev.map((k, idx) => idx === i ? { ...k, [field]: value } : k));

  const save = () => {
    const cleaned = kpis
      .map(k => ({ ...k, key: k.key.trim() || k.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') }))
      .filter(k => k.label.trim());
    if (cleaned.length === 0) {
      toast.error('Add at least one invigilator KPI');
      return;
    }
    updateMutation.mutate({ nazraReverseOrder: reverseOrder, invigilatorKpis: cleaned }, {
      onSuccess: () => { toast.success('Settings saved'); onClose(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save settings'),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Qaida/Nazra Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <p className="text-xs text-gray-400 text-center py-8">Loading…</p>
          ) : (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                  <input type="checkbox" checked={reverseOrder} onChange={e => setReverseOrder(e.target.checked)} />
                  Start Nazra from Para 30 (Juzz 30) and work backward to Para 1
                </label>
                <p className="text-[11px] text-gray-400 mt-1 ml-6">
                  Many schools teach the shorter surahs first. Off by default (standard Juzz 1→30 order).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Invigilator Assessment KPIs</p>
                  <button onClick={addKpi} className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium hover:underline">
                    <Plus size={12} /> Add KPI
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">
                  Customize what an invigilator scores on their periodic visit — defaults to Makharij, Qawa'id, Lehja, Tajweed, Rawani.
                </p>
                <div className="space-y-2">
                  {kpis.map((k, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={k.label} onChange={e => updateKpi(i, 'label', e.target.value)} placeholder="KPI label (e.g. Makharij)"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                      <input value={k.labelUrdu || ''} onChange={e => updateKpi(i, 'labelUrdu', e.target.value)} placeholder="Urdu (optional)" dir="rtl"
                        className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                      <button onClick={() => removeKpi(i)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={13} /></button>
                    </div>
                  ))}
                  {kpis.length === 0 && <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">No KPIs yet — add at least one.</p>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="text-xs text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
          <button onClick={save} disabled={updateMutation.isPending}
            className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
            {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QaidaNazraSettingsModal;
