import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import organizationService from '../../../services/organization.service';
import {
  ModalShell, FormSection, HRStaffDropdown,
  GradeCheckboxGrid, SubjectCheckboxGrid,
  inputCls, labelCls, avatarColor, getInitials,
} from './shared';

// ─── ADD TEACHER MODAL ────────────────────────────────────────────────────────

interface TeacherForm {
  staffId: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  campusId: string;
  campusName: string;
  subjectsCanTeach: string[];
  gradeLevelsCanTeach: string[];
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  isClassTeacher: boolean;
}

const EMPTY_FORM: TeacherForm = {
  staffId: '', firstName: '', lastName: '', designation: '', department: '', campusId: '', campusName: '',
  subjectsCanTeach: [], gradeLevelsCanTeach: [],
  maxPeriodsPerDay: 6, maxPeriodsPerWeek: 30, isClassTeacher: false,
};

function AddTeacherModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<TeacherForm>(EMPTY_FORM);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const { data: campuses = [] } = useQuery({ queryKey: ['campuses'], queryFn: organizationService.getCampuses });

  const mut = useMutation({
    mutationFn: (payload: TeacherForm) => teachingService.createTeacher(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher profile created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create teacher profile'),
  });

  function handleStaffSelect(staff: any) {
    setSelectedStaff(staff);
    setForm(prev => ({
      ...prev,
      staffId: staff.employeeId || staff._id || '',
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      designation: staff.designation || '',
      department: staff.department || '',
      // staff.campusId comes back populated as {_id, name, code} from
      // GET /hr/staff - a Teaching Profile inherits the linked staff
      // member's own campus, it isn't picked independently, so the
      // profile always stays correctly scoped to wherever that person
      // actually works.
      campusId: staff.campusId?._id || '',
      campusName: staff.campusId?.name || '',
    }));
  }

  function handleClearStaff() {
    setSelectedStaff(null);
    setForm(prev => ({ ...prev, staffId: '', firstName: '', lastName: '', designation: '', department: '', campusId: '', campusName: '' }));
  }

  const canSubmit = form.firstName.trim() && form.lastName.trim() && !mut.isPending;

  function handleSubmit(asDraft = false) {
    void mut.mutate({ ...form });
    if (asDraft) void 0; // status field can be added to payload if backend supports
  }

  return (
    <ModalShell title="Add Teaching Profile" sub="Link an HR staff record and configure teaching settings" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-6 space-y-0">

        {/* Section 1: HR Staff Link */}
        <FormSection title="HR Staff Record">
          <HRStaffDropdown value={selectedStaff} onSelect={handleStaffSelect} />

          {/* Profile card */}
          {selectedStaff && (
            <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
                style={{ background: avatarColor(`${selectedStaff.firstName}${selectedStaff.lastName}`) }}
              >
                {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">
                  {selectedStaff.firstName} {selectedStaff.lastName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {[selectedStaff.designation, selectedStaff.department].filter(Boolean).join(' · ')}
                </div>
                <div className="text-xs mt-0.5">
                  {form.campusName ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-[#0C447C] rounded text-[11px] font-medium">📍 {form.campusName}</span>
                  ) : (
                    <span className="text-amber-600">⚠️ No campus assigned on this staff record</span>
                  )}
                </div>
                {(selectedStaff.employeeId || selectedStaff.dateOfJoining) && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedStaff.employeeId && <span>{selectedStaff.employeeId}</span>}
                    {selectedStaff.dateOfJoining && (
                      <span> · Joined {new Date(selectedStaff.dateOfJoining).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearStaff}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Manual name fields (shown when no staff linked, or as read-only when linked) */}
          {!selectedStaff && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelCls}>First Name *</label>
                <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="e.g. Sara" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="e.g. Khan" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Designation</label>
                <input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                  placeholder="e.g. Senior Mathematics Teacher" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="e.g. Teaching" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Campus *</label>
                <select
                  value={form.campusId}
                  onChange={e => {
                    const c = (campuses as any[]).find((c: any) => c._id === e.target.value);
                    setForm(p => ({ ...p, campusId: e.target.value, campusName: c?.name || '' }));
                  }}
                  className={inputCls}
                >
                  <option value="">Select campus…</option>
                  {(campuses as any[]).map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </FormSection>

        {/* Section 2: Subjects */}
        <FormSection title="Subjects Can Teach">
          <SubjectCheckboxGrid
            selected={form.subjectsCanTeach}
            onChange={v => setForm(p => ({ ...p, subjectsCanTeach: v }))}
          />
        </FormSection>

        {/* Section 3: Grade Levels */}
        <FormSection title="Grade Levels">
          <GradeCheckboxGrid
            selected={form.gradeLevelsCanTeach}
            onChange={v => setForm(p => ({ ...p, gradeLevelsCanTeach: v }))}
          />
        </FormSection>

        {/* Section 4: Workload Settings */}
        <FormSection title="Workload Settings">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Max Periods / Day</label>
              <input
                type="number" min={1} max={10}
                value={form.maxPeriodsPerDay}
                onChange={e => setForm(p => ({ ...p, maxPeriodsPerDay: parseInt(e.target.value) || 1 }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max Periods / Week</label>
              <input
                type="number" min={1} max={50}
                value={form.maxPeriodsPerWeek}
                onChange={e => setForm(p => ({ ...p, maxPeriodsPerWeek: parseInt(e.target.value) || 1 }))}
                className={inputCls}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${form.isClassTeacher ? 'bg-[#0C447C]' : 'bg-slate-200'}`}
                  onClick={() => setForm(p => ({ ...p, isClassTeacher: !p.isClassTeacher }))}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isClassTeacher ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-slate-700 font-medium">Class Teacher</span>
              </label>
            </div>
          </div>
        </FormSection>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {mut.isPending && (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            Create Teaching Profile
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  leave:    'bg-amber-50 text-amber-700 border-amber-200',
};

// ─── TEACHERS TAB ─────────────────────────────────────────────────────────────

export function TeachingTeachersTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachingService.getTeachers,
  });

  const filtered = (teachers as any[]).filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (t.subjectsCanTeach || []).some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
    (t.designation ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {showAdd && <AddTeacherModal onClose={() => setShowAdd(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teacher Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {(teachers as any[]).length} teaching profile{(teachers as any[]).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Teaching Profile
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, subject, or designation…"
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading teachers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">👨‍🏫</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">
            {search ? 'No matching teachers' : 'No teacher profiles yet'}
          </div>
          <div className="text-sm text-slate-400 mb-5">
            {search ? 'Try a different search term' : 'Create profiles and link them to HR staff records'}
          </div>
          {!search && (
            <button onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
              Add Teaching Profile
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Teacher', 'Campus', 'Subjects', 'Grade Levels', 'Periods / Week', 'Class Teacher', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => {
                  const subjects: string[] = t.subjectsCanTeach || [];
                  const grades: string[] = t.gradeLevelsCanTeach || [];
                  const statusStyle = STATUS_STYLE[t.status] ?? STATUS_STYLE.inactive;
                  return (
                    <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: avatarColor(`${t.firstName}${t.lastName}`) }}
                          >
                            {getInitials(t.firstName, t.lastName)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{t.firstName} {t.lastName}</div>
                            <div className="text-xs text-slate-400">{t.designation || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {t.campusId?.name || t.campusName || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {subjects.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs">{s}</span>
                          ))}
                          {subjects.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">+{subjects.length - 3}</span>
                          )}
                          {subjects.length === 0 && <span className="text-slate-400 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-600">
                          {grades.length > 0 ? grades.slice(0, 4).join(', ') + (grades.length > 4 ? ` +${grades.length - 4}` : '') : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-slate-700">
                          {t.currentPeriodsPerWeek ?? 0}
                          <span className="text-slate-400 font-normal"> / {t.maxPeriodsPerWeek ?? 30}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {t.isClassTeacher ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">Yes</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium ${statusStyle}`}>
                          {t.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
