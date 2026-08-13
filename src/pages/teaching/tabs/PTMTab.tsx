import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import { StudentSelect } from '../../../components/ui/StudentSelect';
import {
  ModalShell, FormSection, TeacherDropdown,
  inputCls, labelCls,
} from './shared';

const STATUS_STYLE: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  no_show:   'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

// ─── SCHEDULE MEETING MODAL ───────────────────────────────────────────────────
function ScheduleMeetingModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [teacher, setTeacher] = useState<any>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [discussionPoints, setDiscussionPoints] = useState<string[]>(['']);

  const mut = useMutation({
    mutationFn: () => teachingService.createPTMMeeting({
      studentId, teacherId: teacher.staffId, scheduledDate, startTime, endTime,
      academicYear: localStorage.getItem('academicYear') || '',
      discussionPoints: discussionPoints.filter(Boolean),
    }),
    onSuccess: (res: any) => {
      const notified = res.notificationStatus === 'sent' ? ' — guardian notified by email' : ` (notification: ${res.notificationStatus})`;
      toast.success(`Meeting scheduled${notified}`);
      qc.invalidateQueries({ queryKey: ['ptm-meetings'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to schedule meeting'),
  });

  return (
    <ModalShell title="Schedule Parent-Teacher Meeting" sub="E-Plan: set the agenda now so both sides know why they're meeting" onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6 space-y-4">
        <FormSection title="Student">
          <StudentSelect value={studentId} onChange={(id) => setStudentId(id)} />
        </FormSection>
        <FormSection title="Teacher">
          <TeacherDropdown value={teacher} onSelect={setTeacher} />
        </FormSection>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Start Time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Time</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Discussion Points</label>
          <div className="space-y-2">
            {discussionPoints.map((point, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={point}
                  onChange={e => setDiscussionPoints(prev => prev.map((p, idx) => idx === i ? e.target.value : p))}
                  placeholder="e.g. Recent decline in Math scores"
                  className={inputCls}
                />
                {discussionPoints.length > 1 && (
                  <button onClick={() => setDiscussionPoints(prev => prev.filter((_, idx) => idx !== i))} className="px-2 text-slate-400 hover:text-red-500">✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setDiscussionPoints(prev => [...prev, ''])} className="text-xs text-[#0C447C] font-medium hover:underline mt-1.5">＋ Add point</button>
        </div>
      </div>
      <div className="p-6 pt-0 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button
          onClick={() => mut.mutate()}
          disabled={!studentId || !teacher || !scheduledDate || mut.isPending}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mut.isPending ? 'Scheduling…' : 'Schedule Meeting'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── RECORD OUTCOME MODAL ─────────────────────────────────────────────────────
function RecordOutcomeModal({ meeting, onClose }: { meeting: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [parentAttended, setParentAttended] = useState(true);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [actionItems, setActionItems] = useState<{ description: string; assignedTo: string; dueDate: string }[]>([]);

  const mut = useMutation({
    mutationFn: () => teachingService.recordPTMOutcome(meeting._id, { parentAttended, meetingNotes, actionItems }),
    onSuccess: () => { toast.success('Outcome recorded'); qc.invalidateQueries({ queryKey: ['ptm-meetings'] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record outcome'),
  });

  return (
    <ModalShell title={`Record Outcome — ${meeting.studentName}`} sub="E-Management: what actually happened" onClose={onClose} maxWidth="max-w-lg">
      <div className="p-6 space-y-4">
        <div>
          <label className={labelCls}>Did the parent attend?</label>
          <div className="flex gap-2">
            <button onClick={() => setParentAttended(true)} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${parentAttended ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>Yes, attended</button>
            <button onClick={() => setParentAttended(false)} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${!parentAttended ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-200 text-slate-500'}`}>No-show</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Meeting Notes</label>
          <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={4} className={inputCls + ' resize-none'} placeholder="Summary of what was discussed…" />
        </div>
        <div>
          <label className={labelCls}>Action Items</label>
          <div className="space-y-2">
            {actionItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input value={item.description} onChange={e => setActionItems(prev => prev.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))} placeholder="Action item" className={inputCls} />
                <input value={item.assignedTo} onChange={e => setActionItems(prev => prev.map((it, idx) => idx === i ? { ...it, assignedTo: e.target.value } : it))} placeholder="Assigned to" className={inputCls} style={{ maxWidth: 140 }} />
                <input type="date" value={item.dueDate} onChange={e => setActionItems(prev => prev.map((it, idx) => idx === i ? { ...it, dueDate: e.target.value } : it))} className={inputCls} style={{ maxWidth: 150 }} />
                <button onClick={() => setActionItems(prev => prev.filter((_, idx) => idx !== i))} className="px-2 text-slate-400 hover:text-red-500">✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => setActionItems(prev => [...prev, { description: '', assignedTo: '', dueDate: '' }])} className="text-xs text-[#0C447C] font-medium hover:underline mt-1.5">＋ Add action item</button>
        </div>
      </div>
      <div className="p-6 pt-0 flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] disabled:opacity-40">
          {mut.isPending ? 'Saving…' : 'Save Outcome'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── PTM TAB ───────────────────────────────────────────────────────────────────
export function TeachingPTMTab() {
  const qc = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [outcomeFor, setOutcomeFor] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats } = useQuery({ queryKey: ['ptm-dashboard'], queryFn: teachingService.getPTMDashboard });
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['ptm-meetings', statusFilter],
    queryFn: () => teachingService.getPTMMeetings(statusFilter ? { status: statusFilter } : {}),
  });

  const confirmMut = useMutation({
    mutationFn: (id: string) => teachingService.confirmPTMMeeting(id),
    onSuccess: () => { toast.success('Meeting confirmed'); qc.invalidateQueries({ queryKey: ['ptm-meetings'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => teachingService.cancelPTMMeeting(id, 'Cancelled by staff'),
    onSuccess: () => { toast.success('Meeting cancelled'); qc.invalidateQueries({ queryKey: ['ptm-meetings'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      {showSchedule && <ScheduleMeetingModal onClose={() => setShowSchedule(false)} />}
      {outcomeFor && <RecordOutcomeModal meeting={outcomeFor} onClose={() => setOutcomeFor(null)} />}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Parent-Teacher Meetings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule, alert, and document — with full history per student</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Upcoming</div>
          <div className="text-2xl font-bold text-[#0C447C]">{stats?.upcoming ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">{stats?.completed ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">No-Shows</div>
          <div className="text-2xl font-bold text-red-600">{stats?.noShow ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Open Action Items</div>
          <div className="text-2xl font-bold text-amber-600">{stats?.actionItemsOpen ?? 0}</div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'requested', 'confirmed', 'completed', 'no_show', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${statusFilter === s ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading meetings…
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">🗓️</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No meetings {statusFilter ? `in "${statusFilter}"` : 'yet'}</div>
          <div className="text-sm text-slate-400">Schedule a parent-teacher meeting to get started.</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Date', 'Student', 'Teacher', 'Guardian', 'Discussion Points', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {meetings.map((m: any) => (
                  <tr key={m._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-700">{new Date(m.scheduledDate).toLocaleDateString()}{m.startTime ? ` · ${m.startTime}` : ''}</td>
                    <td className="py-3 px-4 text-slate-700">{m.studentName}<div className="text-xs text-slate-400">{m.gradeLevel} {m.sectionName}</div></td>
                    <td className="py-3 px-4 text-slate-600">{m.teacherName}</td>
                    <td className="py-3 px-4 text-slate-600">{m.guardianName || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{(m.discussionPoints || []).join(', ') || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${STATUS_STYLE[m.status]}`}>{m.status.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {m.status === 'requested' && <button onClick={() => confirmMut.mutate(m._id)} className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-[#0C447C] rounded font-medium">Confirm</button>}
                        {(m.status === 'requested' || m.status === 'confirmed') && (
                          <>
                            <button onClick={() => setOutcomeFor(m)} className="px-2 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-medium">Record Outcome</button>
                            <button onClick={() => cancelMut.mutate(m._id)} className="px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 rounded">Cancel</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
