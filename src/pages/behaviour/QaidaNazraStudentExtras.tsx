// ============================================================
// QAIDA/NAZRA STUDENT EXTRAS — home recitation log + invigilator visits
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================
// Shared panel mounted inside both QaidaStudentModal and NazraStudentModal.
// Home log is read-only here (a parent logs it from the Parent app); the
// invigilator assessment form lets a teacher/admin record a single
// student's visit score (the backend also supports a whole-class batch,
// but a per-student quick-add is what this modal context calls for).

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, Home, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import {
  useQaidaNazraSettings, useInvigilatorAssessments, useRecordInvigilatorAssessments, useHomeLog,
} from '../../hooks/useQaidaNazraExtras';

interface Props {
  studentId: string;
  program: 'qaida' | 'nazra';
  // The board/para currently in focus, pre-filled into the invigilator form.
  defaultBoardNumber?: number;
}

export const QaidaNazraStudentExtras: React.FC<Props> = ({ studentId, program, defaultBoardNumber }) => {
  const [homeLogOpen, setHomeLogOpen] = useState(false);
  const [invigilatorOpen, setInvigilatorOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: settings } = useQaidaNazraSettings();
  const { data: homeLog = [] } = useHomeLog(studentId, program);
  const { data: assessments = [] } = useInvigilatorAssessments(studentId, program);
  const recordMutation = useRecordInvigilatorAssessments();

  const kpis = settings?.invigilatorKpis || [];
  const scale = settings?.invigilatorRatingScale || { min: 1, max: 5 };

  const [invigilatorType, setInvigilatorType] = useState<'internal' | 'external'>('external');
  const [invigilatorName, setInvigilatorName] = useState('');
  const [invigilatorOrg, setInvigilatorOrg] = useState('');
  const [boardNumber, setBoardNumber] = useState<number | ''>(defaultBoardNumber ?? '');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [overallRemarks, setOverallRemarks] = useState('');

  const resetForm = () => {
    setInvigilatorName(''); setInvigilatorOrg(''); setOverallRemarks('');
    setScores({}); setBoardNumber(defaultBoardNumber ?? '');
  };

  const submit = () => {
    if (!invigilatorName.trim()) { toast.error('Invigilator name is required'); return; }
    const scoreEntries = kpis.map(k => ({ key: k.key, score: scores[k.key] ?? scale.min }));
    recordMutation.mutate({
      program,
      invigilatorType,
      invigilatorName: invigilatorName.trim(),
      invigilatorOrganization: invigilatorOrg.trim() || undefined,
      entries: [{
        studentId,
        takhtiOrParaNumber: boardNumber === '' ? undefined : Number(boardNumber),
        scores: scoreEntries,
        overallRemarks: overallRemarks.trim() || undefined,
      }],
    }, {
      onSuccess: () => { toast.success('Assessment recorded'); setShowForm(false); resetForm(); },
      onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record assessment'),
    });
  };

  return (
    <div className="space-y-3">
      {/* ── Invigilator Assessments ──────────────────────────── */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setInvigilatorOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
          <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <ClipboardCheck size={14} /> Invigilator Assessments ({assessments.length})
          </span>
          {invigilatorOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {invigilatorOpen && (
          <div className="p-4 space-y-3">
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:underline">
                <Plus size={12} /> Record a visit
              </button>
            )}
            {showForm && (
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <select value={invigilatorType} onChange={e => setInvigilatorType(e.target.value as any)}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none">
                    <option value="external">External invigilator</option>
                    <option value="internal">Internal (staff)</option>
                  </select>
                  <input type="number" value={boardNumber} onChange={e => setBoardNumber(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={program === 'qaida' ? 'Takhti # (optional)' : 'Para # (optional)'}
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={invigilatorName} onChange={e => setInvigilatorName(e.target.value)} placeholder="Invigilator name"
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                  {invigilatorType === 'external' && (
                    <input value={invigilatorOrg} onChange={e => setInvigilatorOrg(e.target.value)} placeholder="Organization (optional)"
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {kpis.map(k => (
                    <div key={k.key}>
                      <p className="text-[10px] text-gray-500 mb-1">{k.label}</p>
                      <div className="flex gap-1">
                        {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i).map(n => (
                          <button key={n} onClick={() => setScores(s => ({ ...s, [k.key]: n }))}
                            className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${(scores[k.key] ?? 0) >= n ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-emerald-100'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <textarea rows={2} value={overallRemarks} onChange={e => setOverallRemarks(e.target.value)} placeholder="Remarks (optional)…"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none resize-none" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="text-xs text-gray-500 px-3 py-1.5 font-medium">Cancel</button>
                  <button onClick={submit} disabled={recordMutation.isPending}
                    className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                    {recordMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {assessments.length === 0 && !showForm && (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">No invigilator visits recorded yet.</p>
            )}
            <div className="space-y-1.5">
              {assessments.map((a: any) => (
                <div key={a._id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700">
                      {a.invigilatorName}{a.invigilatorOrganization ? ` (${a.invigilatorOrganization})` : ''}
                      <span className="text-gray-400 font-normal capitalize"> · {a.invigilatorType}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(a.visitDate).toLocaleDateString()}
                      {a.takhtiOrParaNumber ? ` · ${program === 'qaida' ? 'Takhti' : 'Para'} ${a.takhtiOrParaNumber}` : ''}
                      {a.overallRemarks ? ` · ${a.overallRemarks}` : ''}
                    </p>
                  </div>
                  {a.overallScore != null && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {a.overallScore}/{scale.max}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Home Recitation Log (parent-reported, reference only) ── */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setHomeLogOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
          <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <Home size={14} /> Home Recitation Log ({homeLog.length})
          </span>
          {homeLogOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {homeLogOpen && (
          <div className="p-4 space-y-2">
            <p className="text-[11px] text-gray-400">
              Logged by parents from the home app — reference only, never changes this student's official progress above.
            </p>
            {homeLog.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">No home lessons logged by a parent yet.</p>
            )}
            {homeLog.map((e: any) => (
              <div key={e._id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700">
                    {program === 'qaida' && e.takhtiNumber ? `Takhti ${e.takhtiNumber}` : ''}
                    {program === 'nazra' && e.paraNumber ? `Para ${e.paraNumber}` : ''}
                    {(e.pageFrom || e.pageTo) && ` · ${e.pageFrom || ''}${e.pageTo ? ` – ${e.pageTo}` : ''}`}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(e.date).toLocaleDateString()} · logged by {e.loggedByGuardianName}
                    {e.tutorName ? ` · taught by ${e.tutorName}` : ''}
                    {e.notes ? ` · ${e.notes}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QaidaNazraStudentExtras;
