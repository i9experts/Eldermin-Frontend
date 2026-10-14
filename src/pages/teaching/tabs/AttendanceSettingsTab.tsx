import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';

const MODES: { value: 'daily' | 'subject_wise'; label: string; description: string }[] = [
  {
    value: 'daily',
    label: 'Daily (whole class)',
    description: 'One present/absent/late/excused/half-day status per student per day - the default, and the only mode this school has used so far.',
  },
  {
    value: 'subject_wise',
    label: 'Subject-wise',
    description: 'A class teacher marks a separate status per student for each subject, on the same day - useful for schools that want to track which specific lessons a student missed, not just whether they were in school.',
  },
];

// ─── TEACHING MANAGEMENT — ATTENDANCE SETTINGS TAB ──────────────────────────────
// School-wide policy, not a per-teacher preference - see
// AttendanceSettings (backend) for why this is its own tiny setting
// rather than a field on School/Tenant. Period-wise attendance (tied to
// real Timetable Intelligence periods) is a deliberate follow-up, not
// offered here yet - it needs a real integration with the timetable
// solver's period definitions, which didn't exist for this first pass.
export function TeachingAttendanceSettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['teaching', 'attendance-settings'], queryFn: teachingService.getAttendanceSettings });
  const [mode, setMode] = useState<'daily' | 'subject_wise'>('daily');

  useEffect(() => {
    if ((data as any)?.mode) setMode((data as any).mode);
  }, [data]);

  const mut = useMutation({
    mutationFn: (m: string) => teachingService.updateAttendanceSettings(m),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching', 'attendance-settings'] });
      toast.success('Attendance settings saved');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save'),
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-slate-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose how class attendance is marked across the school. This applies to every class teacher's Attendance screen.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3">
        {MODES.map(m => (
          <label key={m.value}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${mode === m.value ? 'border-[#0C447C] bg-[#0C447C]/5' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="radio" name="attendance-mode" checked={mode === m.value} onChange={() => setMode(m.value)} className="mt-1" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={() => mut.mutate(mode)}
        disabled={mut.isPending || mode === (data as any)?.mode}
        className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mut.isPending ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
