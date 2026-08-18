import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import academicsService from '../../services/academics.service';
import syllabusService from '../../services/syllabus.service';
import organizationService from '../../services/organization.service';
import api from '../../lib/api';
import { CampusDropdown, GradeLevelDropdown, SectionDropdown, GradeCheckboxGrid, useRealGrades } from '../teaching/tabs/shared';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',               icon: '📊' },
  { id: 'curriculum', label: 'Curriculum',             icon: '🧠' },
  { id: 'syllabus',   label: 'Syllabus Manager',       icon: '📚' },
  { id: 'timetable',  label: 'Timetable Intelligence', icon: '📅' },
  { id: 'library',    label: 'Library',                icon: '🏛️' },
];

const SUBJECT_CATEGORIES = ['core','elective','co_curricular','islamic','language','stem','arts','pe','other'];
const BOOK_CATEGORIES = ['textbook','islamic','fiction','reference','science','biography','children','periodical','non_fiction','other'];

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────

function AcademicsDashboardTab() {
  const { data: stats }    = useQuery({ queryKey: ['academics-dashboard'], queryFn: academicsService.getDashboard });
  const { data: libStats } = useQuery({ queryKey: ['library-stats'],       queryFn: academicsService.getLibraryStats });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'],       queryFn: academicsService.getSubjects });
  const { data: syllabi  = [] } = useQuery({ queryKey: ['syllabi'],        queryFn: () => syllabusService.getAll() });
  const { data: overdue  = [] } = useQuery({ queryKey: ['overdue-books'],  queryFn: academicsService.getOverdueIssues });

  const kpis = [
    { label: 'Total Subjects',  value: stats?.totalSubjects  ?? 0, color: '#0C447C', icon: '📖' },
    { label: 'Active Curricula',value: stats?.totalCurricula ?? 0, color: '#1D9E75', icon: '🧠' },
    { label: 'Active Syllabi',  value: stats?.activeSyllabi  ?? 0, color: '#7F77DD', icon: '📚' },
    { label: 'Library Books',   value: libStats?.total       ?? 0, color: '#BA7517', icon: '🏛️' },
    { label: 'Books Available', value: libStats?.available   ?? 0, color: '#1D9E75', icon: '✅' },
    { label: 'Books Issued',    value: libStats?.issued      ?? 0, color: '#378ADD', icon: '📤' },
    { label: 'Overdue Returns', value: libStats?.overdue     ?? 0, color: '#E24B4A', icon: '⚠️' },
    { label: 'Total Issues',    value: libStats?.totalIssues ?? 0, color: '#888',    icon: '📊' },
  ];

  const subjectList = subjects as any[];
  const syllabusList = syllabi as any[];
  const overdueList  = overdue  as any[];

  return (
    <div style={{ padding: '20px' }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{k.icon}</div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueList.length > 0 && (
        <div style={{ background: '#fdecea', border: '1px solid #E24B4A33', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, color: '#E24B4A', marginBottom: '8px' }}>
            ⚠ {overdueList.length} Overdue Book{overdueList.length > 1 ? 's' : ''}
          </div>
          {overdueList.slice(0, 3).map((o: any) => (
            <div key={o._id} style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {o.bookTitle} — {o.borrowerName} — Due: {new Date(o.dueDate).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {/* Two-column info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Subjects by category */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: '10px', fontWeight: 600, color: '#0C447C', marginBottom: '14px' }}>
            Subjects by Category
          </div>
          {subjectList.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '20px' }}>
              No subjects yet. Go to Curriculum to add subjects.
            </div>
          ) : (
            SUBJECT_CATEGORIES.map(cat => {
              const count = subjectList.filter((s: any) => s.category === cat).length;
              if (!count) return null;
              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', textTransform: 'capitalize', color: '#555' }}>
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                      <div style={{ width: `${Math.min((count / subjectList.length) * 100, 100)}%`, height: '100%', background: '#0C447C', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#0C447C', fontWeight: 600, minWidth: '20px' }}>{count}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Syllabus status */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
          <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: '10px', fontWeight: 600, color: '#0C447C', marginBottom: '14px' }}>
            Syllabus Status
          </div>
          {syllabusList.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '20px' }}>
              No syllabi yet. Go to Syllabus Manager.
            </div>
          ) : (
            (['draft','active','approved','archived'] as const).map(status => {
              const count = syllabusList.filter((s: any) => s.status === status).length;
              const colorMap: Record<string, string> = {
                draft: '#888', active: '#378ADD', approved: '#1D9E75', archived: '#aaa',
              };
              const c = colorMap[status];
              return (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '11px', background: c + '22', color: c, textTransform: 'capitalize' }}>
                    {status}
                  </span>
                  <span style={{ fontWeight: 600, color: c }}>{count}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CURRICULUM MODALS ───────────────────────────────────────────────────────

// Aligned exactly with the backend's real enum
// (['cambridge','ib','national','national-pk','american','custom']) -
// 'islamic' and 'hybrid' used to appear here but were never valid backend
// values, so selecting either would have failed validation on save.
// 'national-pk' is Pakistan's Single National Curriculum specifically,
// kept distinct from generic 'national' since it has its own sourced SLO
// template system behind it - see slo-templates.
const FRAMEWORKS = [
  { value: 'national-pk', label: 'Pakistan National Curriculum (SNC)' },
  { value: 'cambridge', label: 'Cambridge (O/A-Level)' },
  { value: 'ib', label: 'International Baccalaureate (IB)' },
  { value: 'american', label: 'American Curriculum' },
  { value: 'national', label: 'National (Other)' },
  { value: 'custom', label: 'Custom' },
];
const BLOOMS_LEVELS = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];

function AddSubjectModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', code: '', category: 'core', gradeLevels: [] as string[], periodsPerWeek: 5, hasLab: false, departmentName: '', description: '' });
  const mut = useMutation({
    mutationFn: academicsService.createSubject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject created'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '580px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ background: '#0C447C', color: '#fff', padding: '16px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600 }}>Add Subject</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            {([{ l: 'Subject Name*', k: 'name' }, { l: 'Subject Code*', k: 'code' }, { l: 'Department', k: 'departmentName' }] as const).map(f => (
              <div key={f.k} style={{ gridColumn: f.k === 'name' ? '1/-1' : 'auto' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.l}</label>
                <input value={(form as any)[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Category*</label>
              <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                {SUBJECT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Periods Per Week</label>
              <input type="number" value={form.periodsPerWeek} onChange={e => setForm(prev => ({ ...prev, periodsPerWeek: parseInt(e.target.value) || 0 }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>Grade Levels</label>
            <GradeCheckboxGrid selected={form.gradeLevels} onChange={v=>setForm(prev=>({...prev,gradeLevels:v}))} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.hasLab} onChange={e => setForm(prev => ({ ...prev, hasLab: e.target.checked }))} />
              Has Laboratory Component
            </label>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => mut.mutate(form)} disabled={!form.name || !form.code || mut.isPending}
            style={{ width: '100%', padding: '10px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', opacity: (!form.name || !form.code || mut.isPending) ? 0.6 : 1 }}>
            {mut.isPending ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCurriculumModal({ subjects, onClose }: { subjects: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: academicYears = [] } = useQuery({ queryKey: ['academic-years-for-curriculum'], queryFn: organizationService.getAcademicYears });
  const [form, setForm] = useState({ name: '', framework: 'national-pk', campusId: '', gradeLevel: '', subjectId: '', subjectName: '', academicYearLabel: '', status: 'draft' });
  useEffect(() => {
    if (!form.academicYearLabel && (academicYears as any[]).length > 0) {
      const current = (academicYears as any[]).find((y: any) => y.isCurrent) || academicYears[0];
      setForm(prev => ({ ...prev, academicYearLabel: current.name }));
    }
  }, [academicYears]);
  const mut = useMutation({
    mutationFn: academicsService.createCurriculum,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['curricula'] }); toast.success('Curriculum created'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ background: '#0C447C', color: '#fff', padding: '16px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600 }}>Create Curriculum</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Curriculum Name*</label>
              <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Framework*</label>
              <select value={form.framework} onChange={e => setForm(prev => ({ ...prev, framework: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <CampusDropdown value={form.campusId} onChange={v=>setForm(prev=>({...prev,campusId:v,gradeLevel:''}))} label="Campus" />
            </div>
            <div>
              <GradeLevelDropdown label="Grade Level*" campusId={form.campusId} value={form.gradeLevel} onChange={v=>setForm(prev=>({...prev,gradeLevel:v}))} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Subject*</label>
              <select value={form.subjectId} onChange={e => {
                const s = subjects.find((x: any) => x._id === e.target.value);
                setForm(prev => ({ ...prev, subjectId: e.target.value, subjectName: s?.name || '' }));
              }} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                <option value="">Select Subject</option>
                {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Academic Year</label>
              <input value={form.academicYearLabel} onChange={e => setForm(prev => ({ ...prev, academicYearLabel: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Status</label>
              <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
          <button onClick={() => mut.mutate(form)} disabled={!form.name || !form.gradeLevel || !form.subjectId || mut.isPending}
            style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', opacity: (!form.name || !form.gradeLevel || !form.subjectId || mut.isPending) ? 0.6 : 1 }}>
            {mut.isPending ? 'Creating...' : 'Create Curriculum'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSLOModal({ curriculum, onClose }: { curriculum: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ sloCode: '', description: '', bloomsLevel: 'Remember', strand: '', isAssessed: false, assessmentType: '' });
  const mut = useMutation({
    mutationFn: (data: any) => academicsService.addSLO(curriculum._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['curricula'] }); toast.success('SLO added'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '520px' }}>
        <div style={{ background: '#0C447C', color: '#fff', padding: '16px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600 }}>Add SLO — {curriculum.subjectName} {curriculum.gradeLevel}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>SLO Code* (e.g. M.5.1)</label>
              <input value={form.sloCode} onChange={e => setForm(prev => ({ ...prev, sloCode: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Bloom's Level*</label>
              <select value={form.bloomsLevel} onChange={e => setForm(prev => ({ ...prev, bloomsLevel: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                {BLOOMS_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Strand (e.g. Number, Algebra)</label>
              <input value={form.strand} onChange={e => setForm(prev => ({ ...prev, strand: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Assessment Type</label>
              <input value={form.assessmentType} onChange={e => setForm(prev => ({ ...prev, assessmentType: e.target.value }))} placeholder="e.g. MCQ, Written"
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Description*</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}>
            <input type="checkbox" checked={form.isAssessed} onChange={e => setForm(prev => ({ ...prev, isAssessed: e.target.checked }))} />
            This SLO is formally assessed
          </label>
          <button onClick={() => mut.mutate(form)} disabled={!form.sloCode || !form.description || mut.isPending}
            style={{ width: '100%', padding: '10px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', opacity: (!form.sloCode || !form.description || mut.isPending) ? 0.6 : 1 }}>
            {mut.isPending ? 'Adding...' : 'Add SLO'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSubjectModal({ subject, onClose }: { subject: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: subject.name || '',
    code: subject.code || '',
    category: subject.category || 'core',
    gradeLevels: (subject.gradeLevels || []) as string[],
    periodsPerWeek: subject.periodsPerWeek ?? 5,
    hasLab: subject.hasLab || false,
    departmentName: subject.departmentName || '',
    description: subject.description || '',
  });
  const mut = useMutation({
    mutationFn: (data: any) => academicsService.updateSubject(subject._id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject updated'); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '580px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ background: '#0C447C', color: '#fff', padding: '16px 20px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600 }}>Edit Subject</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            {([{ l: 'Subject Name*', k: 'name' }, { l: 'Subject Code*', k: 'code' }, { l: 'Department', k: 'departmentName' }] as const).map(f => (
              <div key={f.k} style={{ gridColumn: f.k === 'name' ? '1/-1' : 'auto' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>{f.l}</label>
                <input value={(form as any)[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Category*</label>
              <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                {SUBJECT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Periods Per Week</label>
              <input type="number" value={form.periodsPerWeek} onChange={e => setForm(prev => ({ ...prev, periodsPerWeek: parseInt(e.target.value) || 0 }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>Grade Levels</label>
            <GradeCheckboxGrid selected={form.gradeLevels} onChange={v=>setForm(prev=>({...prev,gradeLevels:v}))} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.hasLab} onChange={e => setForm(prev => ({ ...prev, hasLab: e.target.checked }))} />
              Has Laboratory Component
            </label>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={2}
              style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => mut.mutate(form)} disabled={!form.name || !form.code || mut.isPending}
            style={{ width: '100%', padding: '10px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', opacity: (!form.name || !form.code || mut.isPending) ? 0.6 : 1 }}>
            {mut.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CURRICULUM TAB ───────────────────────────────────────────────────────────

function CurriculumTab() {
  const qc = useQueryClient();
  const { data: realGrades = [] } = useRealGrades();
  const [subTab, setSubTab] = useState<'subjects' | 'curricula' | 'slos'>('subjects');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddCurriculum, setShowAddCurriculum] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);
  const [gradeFilter, setGradeFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const { data: subjects = [], isLoading: subLoading } = useQuery({
    queryKey: ['subjects', gradeFilter, catFilter],
    queryFn: () => academicsService.getSubjects(gradeFilter ? { gradeLevel: gradeFilter, ...(catFilter ? { category: catFilter } : {}) } : {}),
  });
  const { data: curricula = [], isLoading: currLoading } = useQuery({
    queryKey: ['curricula', gradeFilter],
    queryFn: () => academicsService.getCurricula(gradeFilter ? { gradeLevel: gradeFilter } : {}),
  });

  const seedMut = useMutation({
    mutationFn: academicsService.seedDefaultSubjects,
    onSuccess: (res: any) => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success(res.message); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const updateSubjectMut = useMutation({
    mutationFn: ({ id, data }: any) => academicsService.updateSubject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject updated'); setEditingSubject(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const catColors: Record<string, string> = {
    core: '#0C447C', islamic: '#1D9E75', language: '#7F77DD', stem: '#BA7517',
    arts: '#E24B4A', pe: '#378ADD', elective: '#888', co_curricular: '#D85A30', other: '#aaa',
  };

  return (
    <div style={{ padding: '16px' }}>
      {showAddSubject && <AddSubjectModal onClose={() => setShowAddSubject(false)} />}
      {showAddCurriculum && <AddCurriculumModal subjects={subjects as any[]} onClose={() => setShowAddCurriculum(false)} />}
      {selectedCurriculum && <AddSLOModal curriculum={selectedCurriculum} onClose={() => setSelectedCurriculum(null)} />}
      {editingSubject && <EditSubjectModal subject={editingSubject} onClose={() => setEditingSubject(null)} />}

      {/* Controls row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#f5f5f5', borderRadius: '8px', padding: '4px' }}>
          {(['subjects', 'curricula', 'slos'] as const).map(t => (
            <button key={t} onClick={() => setSubTab(t)}
              style={{ padding: '6px 14px', background: subTab === t ? '#0C447C' : 'transparent', color: subTab === t ? '#fff' : '#666', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: subTab === t ? 600 : 400 }}>
              {t === 'slos' ? 'SLO Mapping' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
            <option value="">All Grades</option>
            {Array.from(new Set((realGrades as any[]).map((g: any) => g.name))).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {subTab === 'subjects' && (
            <>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}>
                <option value="">All Categories</option>
                {SUBJECT_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
              <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}
                style={{ padding: '7px 14px', border: '1px solid #EF9F27', borderRadius: '6px', background: '#FFF3DC', color: '#BA7517', cursor: 'pointer', fontSize: '13px' }}>
                {seedMut.isPending ? 'Seeding...' : '⚡ Seed Defaults'}
              </button>
              <button onClick={() => setShowAddSubject(true)}
                style={{ padding: '7px 14px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                + Add Subject
              </button>
            </>
          )}
          {subTab === 'curricula' && (
            <button onClick={() => setShowAddCurriculum(true)}
              style={{ padding: '7px 14px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              + Create Curriculum
            </button>
          )}
        </div>
      </div>

      {/* SUBJECTS */}
      {subTab === 'subjects' && (
        subLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading subjects...</div>
        ) : (subjects as any[]).length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📖</div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>No subjects yet</div>
            <div style={{ fontSize: '12px', marginBottom: '16px' }}>Click "Seed Defaults" to add 14 standard subjects instantly</div>
            <button onClick={() => seedMut.mutate()} style={{ padding: '8px 20px', background: '#EF9F27', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              ⚡ Seed Default Subjects
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {(subjects as any[]).map((s: any) => (
              <div key={s._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', borderLeft: `4px solid ${catColors[s.category] || '#888'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{s.code}</div>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '10px', background: (catColors[s.category] || '#888') + '22', color: catColors[s.category] || '#888', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {(s.category || '').replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
                  {(s.gradeLevels || []).slice(0, 4).map((g: string) => (
                    <span key={g} style={{ padding: '1px 6px', background: '#EBF2FA', color: '#0C447C', borderRadius: '99px', fontSize: '10px' }}>{g}</span>
                  ))}
                  {(s.gradeLevels || []).length > 4 && <span style={{ fontSize: '10px', color: '#aaa' }}>+{s.gradeLevels.length - 4}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                  <span>{s.periodsPerWeek} periods/week</span>
                  {s.hasLab && <span style={{ color: '#7F77DD' }}>🔬 Lab</span>}
                </div>
                <div style={{ display:'flex', gap:'6px', marginTop:'10px', paddingTop:'8px', borderTop:'1px solid #f0f0f0' }}>
                  <button onClick={() => setEditingSubject(s)}
                    style={{ flex:1, padding:'5px', background:'#EBF2FA', color:'#0C447C', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>✏ Edit</button>
                  <button onClick={() => { if(window.confirm('Deactivate this subject?')) updateSubjectMut.mutate({ id: s._id, data: { isActive: false } }); }}
                    style={{ padding:'5px 8px', background:'#fdecea', color:'#E24B4A', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* CURRICULA */}
      {subTab === 'curricula' && (
        currLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading curricula...</div>
        ) : (curricula as any[]).length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🧠</div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>No curricula yet</div>
            <div style={{ fontSize: '12px', marginBottom: '16px' }}>Create your first curriculum to map learning outcomes</div>
            <button onClick={() => setShowAddCurriculum(true)} style={{ padding: '8px 20px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              + Create Curriculum
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {(curricula as any[]).map((c: any) => {
              const statusColor: Record<string, string> = { draft: '#888', active: '#1D9E75', archived: '#aaa' };
              const sc = statusColor[c.status] || '#888';
              return (
                <div key={c._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ padding: '2px 8px', background: '#EBF2FA', color: '#0C447C', borderRadius: '99px', fontSize: '10px', textTransform: 'uppercase' }}>{c.framework}</span>
                    <span style={{ padding: '2px 8px', background: sc + '22', color: sc, borderRadius: '99px', fontSize: '10px' }}>{c.status}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{c.subjectName || c.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{c.gradeLevel} • {c.academicYearLabel}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>{(c.slos || []).length} SLOs defined</div>
                  <button onClick={() => setSelectedCurriculum(c)}
                    style={{ width: '100%', padding: '6px', background: '#EBF2FA', color: '#0C447C', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                    + Add SLO
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SLO MAPPING */}
      {subTab === 'slos' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['SLO Code', 'Description', 'Subject', 'Grade', "Bloom's Level", 'Strand', 'Assessed'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', fontWeight: 500, color: '#666', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(curricula as any[]).flatMap((c: any) =>
                (c.slos || []).map((s: any, i: number) => (
                  <tr key={`${c._id}-${i}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#0C447C' }}>{s.sloCode}</td>
                    <td style={{ padding: '8px 10px', maxWidth: '260px' }}>{s.description}</td>
                    <td style={{ padding: '8px 10px' }}>{c.subjectName}</td>
                    <td style={{ padding: '8px 10px' }}>{c.gradeLevel}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 8px', background: '#f0eeff', color: '#7F77DD', borderRadius: '99px', fontSize: '11px' }}>{s.bloomsLevel}</span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#888' }}>{s.strand || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{s.isAssessed ? '✅' : '—'}</td>
                  </tr>
                ))
              )}
              {(curricula as any[]).every((c: any) => !(c.slos || []).length) && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                    No SLOs defined yet. Add curricula and map SLOs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateSyllabusModal({ subjects, onClose }: { subjects: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: academicYears = [] } = useQuery({ queryKey: ['academic-years-for-syllabus'], queryFn: organizationService.getAcademicYears });
  const [form, setForm] = useState({
    subjectName:'', subjectId:'', campusId:'', gradeLevel:'', sectionName:'', framework:'national-pk',
    academicYearLabel:'', recommendedTextbook:'', publisherName:'',
    totalWeeks:36, totalPeriods:180,
    assessmentBreakdown:{ midTerm:30, finalExam:50, classwork:10, homework:10 },
    status:'draft', units: [] as any[],
  });
  useEffect(() => {
    if (!form.academicYearLabel && (academicYears as any[]).length > 0) {
      const current = (academicYears as any[]).find((y: any) => y.isCurrent) || academicYears[0];
      setForm(prev => ({ ...prev, academicYearLabel: current.name }));
    }
  }, [academicYears]);

  // A real, sourced SLO template - only ever applied if the coordinator
  // explicitly chooses to, never silently. Only checked once subject +
  // grade are both picked, since a template is specific to that
  // combination.
  const { data: matchingTemplates = [] } = useQuery({
    queryKey: ['slo-templates', form.subjectName, form.gradeLevel, form.framework],
    queryFn: () => syllabusService.listSloTemplates(form.subjectName, form.gradeLevel, form.framework),
    enabled: !!form.subjectName && !!form.gradeLevel,
  });
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const applyTemplate = async (templateId: string) => {
    const template = await syllabusService.getSloTemplate(templateId);
    setForm(prev => ({ ...prev, units: template.units || [], totalWeeks: template.totalWeeks || prev.totalWeeks }));
    setAppliedTemplateId(templateId);
    toast.success(`Applied "${template.subjectName} - ${template.gradeLevel}" template`);
  };

  const total = form.assessmentBreakdown.midTerm + form.assessmentBreakdown.finalExam + form.assessmentBreakdown.classwork + form.assessmentBreakdown.homework;
  const recommendMut = useMutation({
    mutationFn: () => syllabusService.recommendAssessmentBreakdown(form.subjectName, form.gradeLevel, form.framework),
    onSuccess: (rec: any) => {
      setForm(prev => ({ ...prev, assessmentBreakdown: { midTerm: rec.midTermPct, finalExam: rec.finalExamPct, classwork: rec.classworkPct, homework: rec.homeworkPct } }));
      toast.success(rec.reasoning || 'AI recommendation applied - review before saving');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'AI recommendation failed'),
  });
  const mut = useMutation({
    mutationFn: syllabusService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syllabi'] }); toast.success('Syllabus created'); onClose(); },
    onError: (e:any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:'12px',width:'600px',maxHeight:'88vh',overflowY:'auto'}}>
        <div style={{background:'#0C447C',color:'#fff',padding:'16px 20px',borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between'}}>
          <div style={{fontWeight:600}}>Create Syllabus</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',fontSize:'20px',cursor:'pointer'}}>×</button>
        </div>
        <div style={{padding:'20px'}}>
          <div style={{borderLeft:'3px solid #EF9F27',paddingLeft:'10px',fontWeight:600,color:'#0C447C',marginBottom:'12px',fontSize:'12px',textTransform:'uppercase' as const}}>Basic Information</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Subject*</label>
              <select value={form.subjectId} onChange={e=>{
                const s=(subjects||[]).find((x:any)=>x._id===e.target.value);
                setForm(prev=>({...prev,subjectId:e.target.value,subjectName:s?.name||''}));
              }} style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
                <option value="">Select subject</option>
                {(subjects||[]).map((s:any)=><option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Campus</label>
              <CampusDropdown value={form.campusId} onChange={v=>setForm(prev=>({...prev,campusId:v,gradeLevel:'',sectionName:''}))} label="" />
            </div>
            <div>
              <GradeLevelDropdown label="Grade Level*" campusId={form.campusId} value={form.gradeLevel} onChange={v=>setForm(prev=>({...prev,gradeLevel:v,sectionName:''}))} />
            </div>
            <div>
              <SectionDropdown label="Section (optional)" campusId={form.campusId} gradeLevel={form.gradeLevel} value={form.sectionName} onChange={v=>setForm(prev=>({...prev,sectionName:v}))} />
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Framework*</label>
              <select value={form.framework} onChange={e=>setForm(prev=>({...prev,framework:e.target.value}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
                {FRAMEWORKS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Academic Year</label>
              <select value={form.academicYearLabel} onChange={e=>setForm(prev=>({...prev,academicYearLabel:e.target.value}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
                <option value="">Select academic year</option>
                {(academicYears as any[]).map((y:any)=><option key={y._id} value={y.name}>{y.name}{y.isCurrent?' (current)':''}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Recommended Textbook</label>
              <input value={form.recommendedTextbook} onChange={e=>setForm(prev=>({...prev,recommendedTextbook:e.target.value}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Publisher</label>
              <input value={form.publisherName} onChange={e=>setForm(prev=>({...prev,publisherName:e.target.value}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Total Weeks</label>
              <input type="number" value={form.totalWeeks} onChange={e=>setForm(prev=>({...prev,totalWeeks:parseInt(e.target.value)}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Total Periods</label>
              <input type="number" value={form.totalPeriods} onChange={e=>setForm(prev=>({...prev,totalPeriods:parseInt(e.target.value)}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
            </div>
          </div>
          {(matchingTemplates as any[]).length > 0 && !appliedTemplateId && (
            <div style={{background:'#F1F0FC',border:'1px solid #DCD9F7',borderRadius:'8px',padding:'12px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:600,color:'#7F77DD',marginBottom:'6px'}}>📚 Sourced SLO template available</div>
              {(matchingTemplates as any[]).map((t:any)=>(
                <div key={t._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0'}}>
                  <div style={{fontSize:'12px',color:'#444'}}>
                    {t.subjectName} — {t.gradeLevel}
                    {t.isVerified && <span style={{marginLeft:'6px',fontSize:'10px',color:'#1D9E75'}}>✓ Verified{t.sourceDocument?` · ${t.sourceDocument}`:''}</span>}
                  </div>
                  <button onClick={()=>applyTemplate(t._id)} style={{fontSize:'11px',color:'#fff',background:'#7F77DD',border:'none',borderRadius:'6px',padding:'5px 12px',cursor:'pointer'}}>
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          )}
          {appliedTemplateId && (
            <div style={{background:'#EAF7EE',border:'1px solid #CDEDDA',borderRadius:'8px',padding:'10px 12px',marginBottom:'16px',fontSize:'12px',color:'#1D9E75'}}>
              ✓ Template applied — {form.units.length} unit(s) with real SLO content pre-filled. You can still edit everything after creating.
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <div style={{borderLeft:'3px solid #EF9F27',paddingLeft:'10px',fontWeight:600,color:'#0C447C',fontSize:'12px',textTransform:'uppercase' as const}}>Assessment Breakdown</div>
            <button
              onClick={()=>recommendMut.mutate()}
              disabled={!form.subjectName||!form.gradeLevel||recommendMut.isPending}
              style={{fontSize:'11px',color:'#7F77DD',background:'#F1F0FC',border:'none',borderRadius:'6px',padding:'5px 10px',cursor:'pointer',opacity:(!form.subjectName||!form.gradeLevel)?0.5:1}}>
              {recommendMut.isPending?'Thinking…':'✨ AI Recommend'}
            </button>
          </div>
          <div style={{background:'#f8f9fa',borderRadius:'8px',padding:'14px',marginBottom:'16px'}}>
            <div style={{fontSize:'10px',color:'#999',marginBottom:'8px'}}>Manually enter percentages below, or use AI Recommend above - either way, review and adjust before saving.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'10px'}}>
              {[{l:'Mid Term %',k:'midTerm'},{l:'Final Exam %',k:'finalExam'},{l:'Classwork %',k:'classwork'},{l:'Homework %',k:'homework'}].map(f=>(
                <div key={f.k}>
                  <label style={{fontSize:'11px',color:'#666',display:'block',marginBottom:'4px'}}>{f.l}</label>
                  <input type="number" min="0" max="100"
                    value={(form.assessmentBreakdown as any)[f.k]}
                    onChange={e=>setForm(prev=>({...prev,assessmentBreakdown:{...prev.assessmentBreakdown,[f.k]:parseInt(e.target.value)||0}}))}
                    style={{width:'100%',padding:'7px',border:`1px solid ${total===100?'#e5e7eb':'#E24B4A'}`,borderRadius:'6px',fontSize:'13px',textAlign:'center' as const}}/>
                </div>
              ))}
            </div>
            <div style={{textAlign:'center' as const,fontSize:'13px',fontWeight:600,color:total===100?'#1D9E75':'#E24B4A'}}>
              Total: {total}% {total===100?'✓ Valid':'— Must equal 100%'}
            </div>
            <div style={{display:'flex',gap:'4px',marginTop:'8px',height:'8px'}}>
              {[{k:'midTerm',c:'#0C447C'},{k:'finalExam',c:'#E24B4A'},{k:'classwork',c:'#1D9E75'},{k:'homework',c:'#EF9F27'}].map(b=>(
                <div key={b.k} style={{flex:(form.assessmentBreakdown as any)[b.k],background:b.c,height:'100%',borderRadius:'2px'}}/>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>mut.mutate({...form,status:'draft'})} disabled={!form.subjectName||!form.gradeLevel||total!==100||mut.isPending}
              style={{flex:1,padding:'10px',background:'#f5f5f5',color:'#666',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
              Save as Draft
            </button>
            <button onClick={()=>mut.mutate({...form,status:'active'})} disabled={!form.subjectName||!form.gradeLevel||total!==100||mut.isPending}
              style={{flex:2,padding:'10px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
              {mut.isPending?'Creating...':'Publish Syllabus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SyllabusDetailModal({ syllabus, onClose }: { syllabus: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'units'|'assessment'|'coverage'>('units');
  const [addingUnit, setAddingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({ unitNo:(syllabus.units||[]).length+1, unitName:'', weeks:4, periods:20 });
  const [addingTopicForUnit, setAddingTopicForUnit] = useState<number|null>(null);
  const [topicForm, setTopicForm] = useState({ topicNo:1, topicName:'', description:'' });
  const [addingSubTopicFor, setAddingSubTopicFor] = useState<{unitNo:number; topicNo:number}|null>(null);
  const [subTopicForm, setSubTopicForm] = useState({ subTopicNo:1, subTopicName:'', description:'', plannedWeek:'' as number|'' });

  const addUnitMut = useMutation({
    mutationFn: (data: any) => syllabusService.update(syllabus._id, { units: [...(syllabus.units || []), { ...data, topics: [] }] }),
    onSuccess: (updated:any) => {
      qc.invalidateQueries({ queryKey: ['syllabi'] });
      toast.success('Unit added');
      setAddingUnit(false);
      setUnitForm({ unitNo:(updated.units||[]).length+1, unitName:'', weeks:4, periods:20 });
    },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed'),
  });

  // Adding a topic/sub-topic means resubmitting the whole units array with
  // the new item appended in the right place - the same approach addUnitMut
  // already uses, since PUT /syllabus/:id replaces units wholesale rather
  // than offering a dedicated append endpoint for each nesting level.
  const addTopicMut = useMutation({
    mutationFn: (vars: { unitNo: number; topic: any }) => {
      const newUnits = (syllabus.units || []).map((u: any) =>
        u.unitNo === vars.unitNo ? { ...u, topics: [...(u.topics || []), { ...vars.topic, subTopics: [] }] } : u
      );
      return syllabusService.update(syllabus._id, { units: newUnits });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syllabi'] });
      toast.success('Topic added');
      setAddingTopicForUnit(null);
    },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed'),
  });

  const addSubTopicMut = useMutation({
    mutationFn: (vars: { unitNo: number; topicNo: number; subTopic: any }) => {
      const newUnits = (syllabus.units || []).map((u: any) =>
        u.unitNo !== vars.unitNo ? u : {
          ...u,
          topics: (u.topics || []).map((t: any) =>
            t.topicNo === vars.topicNo ? { ...t, subTopics: [...(t.subTopics || []), vars.subTopic] } : t
          ),
        }
      );
      return syllabusService.update(syllabus._id, { units: newUnits });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syllabi'] });
      toast.success('Sub-topic added');
      setAddingSubTopicFor(null);
    },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed'),
  });

  const markTopicMut = useMutation({
    mutationFn: (vars: { unitNo: number; topicNo: number; isCovered: boolean }) =>
      syllabusService.markTopic(syllabus._id, { ...vars, coveredBy: 'Coordinator' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syllabi'] }); },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed to update coverage'),
  });

  const markSubTopicMut = useMutation({
    mutationFn: (vars: { unitNo: number; topicNo: number; subTopicNo: number; isCovered: boolean }) =>
      syllabusService.markSubTopic(syllabus._id, { ...vars, coveredBy: 'Coordinator' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syllabi'] }); },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed to update coverage'),
  });

  const pacingGuideMut = useMutation({
    mutationFn: () => syllabusService.generatePacingGuide(syllabus._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syllabi'] }); toast.success('Pacing guide generated — every sub-topic now has a planned week'); },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed to generate pacing guide'),
  });
  const totalSubTopicCount = (syllabus.units||[]).reduce((sum:number,u:any)=>sum+(u.topics||[]).reduce((s2:number,t:any)=>s2+(t.subTopics||[]).length,0),0);

  const approveMut = useMutation({
    mutationFn: () => syllabusService.approve(syllabus._id, 'Admin'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syllabi'] }); toast.success('Syllabus approved'); onClose(); },
  });

  const statusColor: any = {draft:'#888',active:'#378ADD',approved:'#1D9E75',archived:'#aaa'};
  const ab = syllabus.assessmentBreakdown || {midTerm:30,finalExam:50,classwork:10,homework:10};

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'20px'}}>
      <div style={{background:'#fff',borderRadius:'12px',width:'700px',maxWidth:'95vw',marginBottom:'20px'}}>

        {/* Header */}
        <div style={{background:'#0C447C',color:'#fff',padding:'16px 20px',borderRadius:'12px 12px 0 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontWeight:700,fontSize:'16px'}}>{syllabus.subjectName} — {syllabus.gradeLevel}</div>
              <div style={{fontSize:'12px',opacity:0.8,marginTop:'3px'}}>
                {(syllabus.framework||'').toUpperCase()} • {syllabus.academicYearLabel} • {syllabus.totalWeeks} weeks • {syllabus.totalPeriods} periods
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'8px',flexWrap:'wrap'}}>
                <span style={{padding:'2px 8px',background:(statusColor[syllabus.status]||'#888')+'44',border:`1px solid ${statusColor[syllabus.status]||'#888'}`,borderRadius:'99px',fontSize:'11px'}}>
                  {syllabus.status}
                </span>
                {syllabus.recommendedTextbook&&(
                  <span style={{padding:'2px 8px',background:'rgba(255,255,255,0.15)',borderRadius:'99px',fontSize:'11px'}}>
                    📚 {syllabus.recommendedTextbook}
                  </span>
                )}
                {syllabus.publisherName&&(
                  <span style={{padding:'2px 8px',background:'rgba(255,255,255,0.15)',borderRadius:'99px',fontSize:'11px'}}>
                    🏢 {syllabus.publisherName}
                  </span>
                )}
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center',flexShrink:0}}>
              {syllabus.status!=='approved'&&(
                <button onClick={()=>approveMut.mutate()} disabled={approveMut.isPending}
                  style={{padding:'6px 14px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:500}}>
                  {approveMut.isPending?'Approving...':'✓ Approve'}
                </button>
              )}
              <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',fontSize:'22px',cursor:'pointer',lineHeight:1}}>×</button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:'1px solid #e5e7eb',background:'#fff'}}>
          {([
            {id:'units',label:'Units & Topics'},
            {id:'assessment',label:'Assessment Breakdown'},
            {id:'coverage',label:'Coverage Tracking'},
          ] as const).map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:'11px 18px',background:'none',border:'none',color:activeTab===t.id?'#0C447C':'#888',borderBottom:activeTab===t.id?'2px solid #EF9F27':'2px solid transparent',cursor:'pointer',fontSize:'13px',fontWeight:activeTab===t.id?600:400}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{padding:'16px',maxHeight:'65vh',overflowY:'auto'}}>

          {/* UNITS TAB */}
          {activeTab==='units'&&(
            <div>
              {totalSubTopicCount>0&&(
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#F1F0FC',border:'1px solid #DCD9F7',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px'}}>
                  <div style={{fontSize:'12px',color:'#555'}}>
                    <strong style={{color:'#7F77DD'}}>{totalSubTopicCount}</strong> sub-topic(s) across this syllabus, over <strong>{syllabus.totalWeeks||36}</strong> weeks
                  </div>
                  <button onClick={()=>pacingGuideMut.mutate()} disabled={pacingGuideMut.isPending}
                    style={{fontSize:'11px',color:'#fff',background:'#7F77DD',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer'}}>
                    {pacingGuideMut.isPending?'Generating…':'📅 Generate Pacing Guide'}
                  </button>
                </div>
              )}
              {(syllabus.units||[]).length===0&&!addingUnit&&(
                <div style={{padding:'40px',textAlign:'center' as const,color:'#aaa',background:'#f9f9f9',borderRadius:'8px',marginBottom:'12px'}}>
                  <div style={{fontSize:'32px',marginBottom:'8px'}}>📖</div>
                  <div style={{fontWeight:500,color:'#888'}}>No units added yet</div>
                  <div style={{fontSize:'12px',marginTop:'4px'}}>Add units to define the syllabus structure</div>
                </div>
              )}

              {(syllabus.units||[]).map((u:any,i:number)=>(
                <div key={i} style={{border:'1px solid #e5e7eb',borderRadius:'8px',marginBottom:'10px',overflow:'hidden'}}>
                  <div style={{padding:'10px 14px',background:'#EBF2FA',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <span style={{fontWeight:600,color:'#0C447C',fontSize:'13px'}}>Unit {u.unitNo}: {u.unitName}</span>
                      <span style={{fontSize:'11px',color:'#888',marginLeft:'10px'}}>{u.weeks} weeks • {u.periods} periods</span>
                    </div>
                    <span style={{fontSize:'11px',color:'#888',padding:'2px 8px',background:'#fff',borderRadius:'99px',border:'1px solid #e5e7eb'}}>
                      {(u.topics||[]).length} topics
                    </span>
                  </div>
                  {(u.topics||[]).length>0&&(
                    <div style={{padding:'8px 14px'}}>
                      {(u.topics||[]).map((topic:any,j:number)=>(
                        <div key={j} style={{padding:'6px 0',borderBottom:j<u.topics.length-1?'1px solid #f5f5f5':'none'}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:'8px'}}>
                            <span style={{fontWeight:600,color:'#0C447C',minWidth:'22px',fontSize:'12px',flexShrink:0}}>{topic.topicNo}.</span>
                            <div style={{flex:1}}>
                              <div style={{fontSize:'12px',fontWeight:500}}>{topic.topicName}</div>
                              {topic.description&&<div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{topic.description}</div>}
                              {(topic.learningObjectives||[]).length>0&&(
                                <div style={{marginTop:'4px'}}>
                                  {(topic.learningObjectives||[]).map((obj:string,k:number)=>(
                                    <div key={k} style={{fontSize:'10px',color:'#666',display:'flex',alignItems:'flex-start',gap:'4px',marginTop:'2px'}}>
                                      <span style={{color:'#1D9E75',flexShrink:0}}>→</span>{obj}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {(topic.subTopics||[]).length>0&&(
                                <div style={{marginTop:'6px',paddingLeft:'4px',borderLeft:'2px solid #EBF2FA'}}>
                                  {(topic.subTopics||[]).map((sub:any,k:number)=>(
                                    <label key={k} style={{display:'flex',alignItems:'center',gap:'6px',padding:'3px 0 3px 8px',cursor:'pointer'}}>
                                      <input type="checkbox" checked={!!sub.isCovered}
                                        onChange={e=>markSubTopicMut.mutate({unitNo:u.unitNo,topicNo:topic.topicNo,subTopicNo:sub.subTopicNo,isCovered:e.target.checked})}
                                        style={{width:'12px',height:'12px'}}/>
                                      <span style={{fontSize:'11px',color:sub.isCovered?'#aaa':'#555',textDecoration:sub.isCovered?'line-through':'none'}}>
                                        {topic.topicNo}.{sub.subTopicNo} {sub.subTopicName}
                                      </span>
                                      {sub.plannedWeek&&(
                                        <span style={{fontSize:'10px',color:'#7F77DD',background:'#F1F0FC',padding:'1px 6px',borderRadius:'99px'}}>Week {sub.plannedWeek}</span>
                                      )}
                                    </label>
                                  ))}
                                </div>
                              )}
                              {addingSubTopicFor?.unitNo===u.unitNo&&addingSubTopicFor?.topicNo===topic.topicNo?(
                                <div style={{marginTop:'6px',padding:'8px',background:'#f8f9fa',borderRadius:'6px'}}>
                                  <div style={{display:'grid',gridTemplateColumns:'1fr 70px',gap:'6px',marginBottom:'6px'}}>
                                    <input placeholder="Sub-topic name" value={subTopicForm.subTopicName}
                                      onChange={e=>setSubTopicForm(p=>({...p,subTopicName:e.target.value}))}
                                      style={{padding:'5px 7px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'11px'}}/>
                                    <input type="number" placeholder="Week" value={subTopicForm.plannedWeek}
                                      onChange={e=>setSubTopicForm(p=>({...p,plannedWeek:e.target.value===''?'':parseInt(e.target.value)}))}
                                      style={{padding:'5px 7px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'11px'}}/>
                                  </div>
                                  <div style={{display:'flex',gap:'6px'}}>
                                    <button onClick={()=>setAddingSubTopicFor(null)} style={{padding:'4px 10px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'#fff',cursor:'pointer',fontSize:'11px'}}>Cancel</button>
                                    <button
                                      onClick={()=>addSubTopicMut.mutate({unitNo:u.unitNo,topicNo:topic.topicNo,subTopic:{subTopicNo:(topic.subTopics||[]).length+1,subTopicName:subTopicForm.subTopicName,description:subTopicForm.description,plannedWeek:subTopicForm.plannedWeek||undefined}})}
                                      disabled={!subTopicForm.subTopicName||addSubTopicMut.isPending}
                                      style={{padding:'4px 12px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'11px'}}>
                                      {addSubTopicMut.isPending?'Adding...':'Add'}
                                    </button>
                                  </div>
                                </div>
                              ):(
                                <button
                                  onClick={()=>{setAddingSubTopicFor({unitNo:u.unitNo,topicNo:topic.topicNo});setSubTopicForm({subTopicNo:(topic.subTopics||[]).length+1,subTopicName:'',description:'',plannedWeek:''});}}
                                  style={{marginTop:'4px',fontSize:'11px',color:'#0C447C',background:'none',border:'none',cursor:'pointer',padding:0}}>
                                  + Add Sub-Topic
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{padding:'8px 14px',borderTop:(u.topics||[]).length>0?'1px solid #f5f5f5':'none'}}>
                    {addingTopicForUnit===u.unitNo?(
                      <div style={{padding:'8px',background:'#f8f9fa',borderRadius:'6px'}}>
                        <div style={{display:'grid',gridTemplateColumns:'50px 1fr',gap:'6px',marginBottom:'6px'}}>
                          <input type="number" placeholder="No." value={topicForm.topicNo}
                            onChange={e=>setTopicForm(p=>({...p,topicNo:parseInt(e.target.value)}))}
                            style={{padding:'5px 7px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'11px'}}/>
                          <input placeholder="Topic name" value={topicForm.topicName}
                            onChange={e=>setTopicForm(p=>({...p,topicName:e.target.value}))}
                            style={{padding:'5px 7px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'11px'}}/>
                        </div>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>setAddingTopicForUnit(null)} style={{padding:'4px 10px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'#fff',cursor:'pointer',fontSize:'11px'}}>Cancel</button>
                          <button
                            onClick={()=>addTopicMut.mutate({unitNo:u.unitNo,topic:{topicNo:topicForm.topicNo,topicName:topicForm.topicName,description:topicForm.description}})}
                            disabled={!topicForm.topicName||addTopicMut.isPending}
                            style={{padding:'4px 12px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'11px'}}>
                            {addTopicMut.isPending?'Adding...':'Add Topic'}
                          </button>
                        </div>
                      </div>
                    ):(
                      <button
                        onClick={()=>{setAddingTopicForUnit(u.unitNo);setTopicForm({topicNo:(u.topics||[]).length+1,topicName:'',description:''});}}
                        style={{fontSize:'11px',color:'#0C447C',background:'none',border:'none',cursor:'pointer',padding:0}}>
                        + Add Topic
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {addingUnit?(
                <div style={{background:'#f8f9fa',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'14px'}}>
                  <div style={{fontWeight:600,color:'#0C447C',marginBottom:'10px',fontSize:'13px'}}>Add New Unit</div>
                  <div style={{display:'grid',gridTemplateColumns:'50px 1fr 80px 80px',gap:'8px',marginBottom:'10px'}}>
                    <div>
                      <label style={{fontSize:'11px',color:'#666',display:'block',marginBottom:'3px'}}>No.</label>
                      <input type="number" value={unitForm.unitNo}
                        onChange={e=>setUnitForm(prev=>({...prev,unitNo:parseInt(e.target.value)}))}
                        style={{width:'100%',padding:'6px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',color:'#666',display:'block',marginBottom:'3px'}}>Unit Name*</label>
                      <input value={unitForm.unitName} placeholder="e.g. Number System"
                        onChange={e=>setUnitForm(prev=>({...prev,unitName:e.target.value}))}
                        style={{width:'100%',padding:'6px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',color:'#666',display:'block',marginBottom:'3px'}}>Weeks</label>
                      <input type="number" value={unitForm.weeks}
                        onChange={e=>setUnitForm(prev=>({...prev,weeks:parseInt(e.target.value)}))}
                        style={{width:'100%',padding:'6px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:'11px',color:'#666',display:'block',marginBottom:'3px'}}>Periods</label>
                      <input type="number" value={unitForm.periods}
                        onChange={e=>setUnitForm(prev=>({...prev,periods:parseInt(e.target.value)}))}
                        style={{width:'100%',padding:'6px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px'}}/>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button onClick={()=>setAddingUnit(false)}
                      style={{padding:'7px 14px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'#fff',cursor:'pointer',fontSize:'12px'}}>
                      Cancel
                    </button>
                    <button onClick={()=>addUnitMut.mutate(unitForm)}
                      disabled={!unitForm.unitName||addUnitMut.isPending}
                      style={{padding:'7px 16px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>
                      {addUnitMut.isPending?'Adding...':'Add Unit'}
                    </button>
                  </div>
                </div>
              ):(
                <button onClick={()=>setAddingUnit(true)}
                  style={{width:'100%',padding:'10px',border:'2px dashed #e5e7eb',borderRadius:'8px',background:'#f9f9f9',color:'#888',cursor:'pointer',fontSize:'13px',marginTop:'4px'}}>
                  + Add Unit
                </button>
              )}
            </div>
          )}

          {/* ASSESSMENT TAB */}
          {activeTab==='assessment'&&(
            <div>
              <div style={{height:'28px',display:'flex',borderRadius:'8px',overflow:'hidden',marginBottom:'16px'}}>
                {[{l:'Mid Term',v:ab.midTerm,c:'#0C447C'},{l:'Final Exam',v:ab.finalExam,c:'#E24B4A'},{l:'Classwork',v:ab.classwork,c:'#1D9E75'},{l:'Homework',v:ab.homework,c:'#EF9F27'}].map(b=>(
                  <div key={b.l} style={{flex:b.v,background:b.c,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {b.v>10&&<span style={{fontSize:'11px',color:'#fff',fontWeight:600}}>{b.v}%</span>}
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                {[
                  {l:'Mid Term Examination',v:ab.midTerm,c:'#0C447C',desc:'Written exam covering first half of syllabus'},
                  {l:'Final Examination',v:ab.finalExam,c:'#E24B4A',desc:'Comprehensive end-of-year final exam'},
                  {l:'Classwork & Participation',v:ab.classwork,c:'#1D9E75',desc:'Daily class activities and participation'},
                  {l:'Homework & Assignments',v:ab.homework,c:'#EF9F27',desc:'Home-based tasks and project work'},
                ].map(b=>(
                  <div key={b.l} style={{background:'#f8f9fa',borderRadius:'8px',padding:'14px',borderLeft:`4px solid ${b.c}`}}>
                    <div style={{fontSize:'26px',fontWeight:700,color:b.c}}>{b.v}%</div>
                    <div style={{fontSize:'12px',fontWeight:600,marginTop:'3px',color:'#333'}}>{b.l}</div>
                    <div style={{fontSize:'11px',color:'#888',marginTop:'3px'}}>{b.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'#EBF2FA',borderRadius:'8px',padding:'12px',fontSize:'12px',color:'#0C447C'}}>
                ℹ Total: {ab.midTerm+ab.finalExam+ab.classwork+ab.homework}% — {ab.midTerm+ab.finalExam+ab.classwork+ab.homework===100?'Valid assessment breakdown ✓':'Warning: Must equal 100%'}
              </div>
            </div>
          )}

          {/* COVERAGE TAB */}
          {activeTab==='coverage'&&(
            <div>
              <div style={{background:'#EBF2FA',border:'1px solid #B5D4F4',borderRadius:'8px',padding:'12px',marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:'20px',color:'#0C447C'}}>{syllabus.coveragePct ?? 0}%</div>
                  <div style={{fontSize:'11px',color:'#0C447C',opacity:0.8}}>{syllabus.coveredTopics ?? 0} of {syllabus.totalTopics ?? 0} topics covered</div>
                </div>
                <span style={{padding:'4px 10px',borderRadius:'99px',fontSize:'11px',fontWeight:600,
                  background: syllabus.trackStatus==='completed'?'#1D9E7522':syllabus.trackStatus==='behind'?'#E24B4A22':syllabus.trackStatus==='on_track'?'#378ADD22':'#88888822',
                  color: syllabus.trackStatus==='completed'?'#1D9E75':syllabus.trackStatus==='behind'?'#E24B4A':syllabus.trackStatus==='on_track'?'#378ADD':'#888'}}>
                  {(syllabus.trackStatus||'not_started').replace('_',' ')}
                </span>
              </div>

              {(syllabus.units||[]).length===0 ? (
                <div style={{padding:'30px',textAlign:'center' as const,color:'#aaa',background:'#f9f9f9',borderRadius:'8px'}}>
                  Add units and topics first (Units & Topics tab) before tracking coverage.
                </div>
              ) : (
                (syllabus.units||[]).map((u:any)=>(
                  <div key={u.unitNo} style={{border:'1px solid #e5e7eb',borderRadius:'8px',marginBottom:'10px',overflow:'hidden'}}>
                    <div style={{padding:'8px 14px',background:'#f8f9fa',fontWeight:600,color:'#0C447C',fontSize:'12px'}}>
                      Unit {u.unitNo}: {u.unitName}
                    </div>
                    <div style={{padding:'4px 14px'}}>
                      {(u.topics||[]).map((topic:any)=>(
                        <label key={topic.topicNo} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 0',borderBottom:'1px solid #f5f5f5',cursor:'pointer'}}>
                          <input
                            type="checkbox"
                            checked={!!topic.isCovered}
                            onChange={(e)=>markTopicMut.mutate({ unitNo: u.unitNo, topicNo: topic.topicNo, isCovered: e.target.checked })}
                          />
                          <span style={{fontSize:'12px',flex:1,textDecoration:topic.isCovered?'line-through':'none',color:topic.isCovered?'#888':'#333'}}>
                            {topic.topicNo}. {topic.topicName}
                          </span>
                          {topic.isCovered && topic.coveredDate && (
                            <span style={{fontSize:'10px',color:'#1D9E75'}}>✓ {new Date(topic.coveredDate).toLocaleDateString()}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
              <div style={{fontSize:'11px',color:'#888',marginTop:'8px'}}>
                This is the same live coverage data teachers track from Teaching Management → Syllabus - marking a topic here or there updates the same record.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SyllabusManagerTab() {
  const qc = useQueryClient();
  const { data: realGrades = [] } = useRealGrades();
  const [view, setView] = useState<'syllabi'|'slo-templates'>('syllabi');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: syllabi = [], isLoading } = useQuery({
    queryKey: ['syllabi', gradeFilter, statusFilter],
    queryFn: () => syllabusService.getAll(gradeFilter||statusFilter?{gradeLevel:gradeFilter||undefined,status:statusFilter||undefined}:{}),
  });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: academicsService.getSubjects });
  const approveMut = useMutation({
    mutationFn: (id:string) => syllabusService.approve(id,'Admin'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syllabi'] }); toast.success('Syllabus approved'); },
  });
  const statusColor: any = {draft:'#888',active:'#378ADD',approved:'#1D9E75',archived:'#aaa'};
  const frameworkColor: any = {cambridge:'#0C447C',ib:'#7F77DD',national:'#1D9E75',american:'#378ADD',islamic:'#1D9E75',custom:'#BA7517'};
  return (
    <div style={{padding:'16px'}}>
      {showCreate && <CreateSyllabusModal subjects={subjects as any[]} onClose={()=>setShowCreate(false)} />}
      {selectedSyllabus && <SyllabusDetailModal syllabus={selectedSyllabus} onClose={()=>setSelectedSyllabus(null)} />}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <div style={{display:'flex',background:'#f1f1f1',borderRadius:'8px',padding:'2px'}}>
          <button onClick={()=>setView('syllabi')} style={{padding:'6px 14px',fontSize:'12px',fontWeight:500,borderRadius:'6px',border:'none',cursor:'pointer',background:view==='syllabi'?'#fff':'transparent',color:view==='syllabi'?'#0C447C':'#666',boxShadow:view==='syllabi'?'0 1px 2px rgba(0,0,0,0.1)':'none'}}>Syllabi</button>
          <button onClick={()=>setView('slo-templates')} style={{padding:'6px 14px',fontSize:'12px',fontWeight:500,borderRadius:'6px',border:'none',cursor:'pointer',background:view==='slo-templates'?'#fff':'transparent',color:view==='slo-templates'?'#0C447C':'#666',boxShadow:view==='slo-templates'?'0 1px 2px rgba(0,0,0,0.1)':'none'}}>SLO Templates</button>
        </div>
      </div>
      {view==='slo-templates'?<SloTemplatesView subjects={subjects as any[]} />:(
      <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
        <div style={{display:'flex',gap:'8px'}}>
          <select value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)} style={{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
            <option value="">All Grades</option>
            {Array.from(new Set((realGrades as any[]).map((g: any) => g.name))).map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
            <option value="">All Status</option>
            {['draft','active','approved','archived'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{padding:'7px 16px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>+ New Syllabus</button>
      </div>
      {isLoading?<div style={{padding:'40px',textAlign:'center' as const,color:'#888'}}>Loading...</div>:
      (syllabi as any[]).length===0?(
        <div style={{padding:'60px',textAlign:'center' as const,color:'#888',background:'#f9f9f9',borderRadius:'8px'}}>
          <div style={{fontSize:'40px',marginBottom:'8px'}}>📚</div>
          <div style={{fontWeight:500,marginBottom:'12px'}}>No syllabi yet</div>
          <button onClick={()=>setShowCreate(true)} style={{padding:'8px 20px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>+ Create First Syllabus</button>
        </div>
      ):(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead><tr style={{background:'#f8f9fa'}}>
              {['Subject','Grade','Framework','Textbook','Units','Periods','Status','Actions'].map(h=>(
                <th key={h} style={{padding:'10px',textAlign:'left' as const,fontWeight:500,color:'#666',borderBottom:'1px solid #e5e7eb'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{(syllabi as any[]).map((s:any)=>(
              <tr key={s._id} style={{borderBottom:'1px solid #f0f0f0'}}>
                <td style={{padding:'10px',fontWeight:500}}>{s.subjectName}</td>
                <td style={{padding:'10px'}}>{s.gradeLevel}</td>
                <td style={{padding:'10px'}}><span style={{padding:'2px 8px',background:(frameworkColor[s.framework]||'#888')+'22',color:frameworkColor[s.framework]||'#888',borderRadius:'99px',fontSize:'11px',textTransform:'uppercase' as const}}>{s.framework}</span></td>
                <td style={{padding:'10px',fontSize:'12px',color:'#888'}}>{s.recommendedTextbook||'—'}</td>
                <td style={{padding:'10px',textAlign:'center' as const}}><span style={{padding:'2px 8px',background:'#EBF2FA',color:'#0C447C',borderRadius:'99px',fontSize:'11px',fontWeight:500}}>{(s.units||[]).length}</span></td>
                <td style={{padding:'10px',textAlign:'center' as const,color:'#666'}}>{s.totalPeriods||'—'}</td>
                <td style={{padding:'10px'}}><span style={{padding:'2px 8px',background:(statusColor[s.status]||'#888')+'22',color:statusColor[s.status]||'#888',borderRadius:'99px',fontSize:'11px'}}>{s.status}</span></td>
                <td style={{padding:'10px'}}>
                  <div style={{display:'flex',gap:'5px'}}>
                    <button onClick={()=>setSelectedSyllabus(s)} style={{padding:'4px 10px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'#fff',cursor:'pointer',fontSize:'11px',color:'#0C447C'}}>View</button>
                    {s.status!=='approved'&&<button onClick={()=>approveMut.mutate(s._id)} style={{padding:'4px 10px',border:'none',borderRadius:'4px',background:'#e6f7ed',cursor:'pointer',fontSize:'11px',color:'#1D9E75'}}>Approve</button>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ─── SLO TEMPLATES ────────────────────────────────────────────────────────────
// Where verified, sourced curriculum content actually gets created - this
// was the missing piece: CreateSyllabusModal could only ever apply a
// template, never create one. isVerified/sourceDocument are deliberately
// controlled entirely by whoever enters the content, never defaulted to
// true, since that would let unverified content silently pass as sourced.
function SloTemplatesView({ subjects }: { subjects: any[] }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['slo-templates-all'], queryFn: () => syllabusService.listSloTemplates() });

  const verifyMut = useMutation({
    mutationFn: (t: any) => syllabusService.updateSloTemplate(t._id, { isVerified: true, verifiedDate: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['slo-templates-all'] }); toast.success('Marked as verified'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => syllabusService.deleteSloTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['slo-templates-all'] }); toast.success('Template deleted'); },
  });

  return (
    <div>
      <div style={{background:'#FFF8EC',border:'1px solid #F5E3BE',borderRadius:'8px',padding:'12px 14px',marginBottom:'16px',fontSize:'12px',color:'#8A6D1D'}}>
        Only enter content you can confirm against a real, named source (e.g. the actual SNC document for that subject/grade). Templates are never auto-generated - that's deliberate, since getting official curriculum content wrong is worse than not having it at all.
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'12px'}}>
        <button onClick={()=>setShowCreate(true)} style={{padding:'7px 16px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>+ New SLO Template</button>
      </div>
      {isLoading?<div style={{padding:'40px',textAlign:'center' as const,color:'#888'}}>Loading...</div>:
      (templates as any[]).length===0?(
        <div style={{padding:'60px',textAlign:'center' as const,color:'#888',background:'#f9f9f9',borderRadius:'8px'}}>
          <div style={{fontSize:'40px',marginBottom:'8px'}}>📖</div>
          <div style={{fontWeight:500,marginBottom:'12px'}}>No SLO templates yet</div>
          <button onClick={()=>setShowCreate(true)} style={{padding:'8px 20px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer'}}>+ Create First Template</button>
        </div>
      ):(
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead><tr style={{background:'#f8f9fa'}}>
              {['Subject','Grade','Framework','Source','Units','Verified','Actions'].map(h=>(
                <th key={h} style={{padding:'10px',textAlign:'left' as const,fontWeight:500,color:'#666',borderBottom:'1px solid #e5e7eb'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{(templates as any[]).map((t:any)=>(
              <tr key={t._id} style={{borderBottom:'1px solid #f0f0f0'}}>
                <td style={{padding:'10px',fontWeight:500}}>{t.subjectName}</td>
                <td style={{padding:'10px'}}>{t.gradeLevel}</td>
                <td style={{padding:'10px'}}><span style={{padding:'2px 8px',background:'#EBF2FA',color:'#0C447C',borderRadius:'99px',fontSize:'11px'}}>{FRAMEWORKS.find(f=>f.value===t.framework)?.label||t.framework}</span></td>
                <td style={{padding:'10px',fontSize:'12px',color:'#888',maxWidth:'180px'}}>{t.sourceDocument||'—'}</td>
                <td style={{padding:'10px',textAlign:'center' as const}}>{(t.units||[]).length}</td>
                <td style={{padding:'10px'}}>
                  {t.isVerified?<span style={{padding:'2px 8px',background:'#EAF7EE',color:'#1D9E75',borderRadius:'99px',fontSize:'11px'}}>✓ Verified</span>
                    :<span style={{padding:'2px 8px',background:'#FFF3E0',color:'#BA7517',borderRadius:'99px',fontSize:'11px'}}>Unverified</span>}
                </td>
                <td style={{padding:'10px'}}>
                  <div style={{display:'flex',gap:'5px'}}>
                    <button onClick={()=>setEditing(t)} style={{padding:'4px 10px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'#fff',cursor:'pointer',fontSize:'11px',color:'#0C447C'}}>Edit</button>
                    {!t.isVerified&&<button onClick={()=>verifyMut.mutate(t)} style={{padding:'4px 10px',border:'none',borderRadius:'4px',background:'#e6f7ed',cursor:'pointer',fontSize:'11px',color:'#1D9E75'}}>Verify</button>}
                    <button onClick={()=>{if(confirm(`Delete the ${t.subjectName} - ${t.gradeLevel} template?`))deleteMut.mutate(t._id)}} style={{padding:'4px 10px',border:'none',borderRadius:'4px',background:'#FEECEC',cursor:'pointer',fontSize:'11px',color:'#E24B4A'}}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {showCreate && <SloTemplateFormModal subjects={subjects} onClose={()=>setShowCreate(false)} />}
      {editing && <SloTemplateFormModal subjects={subjects} existing={editing} onClose={()=>setEditing(null)} />}
    </div>
  );
}

function SloTemplateFormModal({ subjects, existing, onClose }: { subjects: any[]; existing?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    subjectName: existing?.subjectName || '', gradeLevel: existing?.gradeLevel || '',
    framework: existing?.framework || 'national-pk',
    sourceDocument: existing?.sourceDocument || '', sourceNotes: existing?.sourceNotes || '',
    isVerified: existing?.isVerified || false,
  });
  // Each unit holds its topics as raw editable text - one line per
  // topic in the format "Topic Name :: objective one | objective two" -
  // simpler to type/paste from a real source document than a fully
  // nested form for what's meant to be entered carefully, once.
  const [units, setUnits] = useState<{ unitName: string; topicsText: string }[]>(
    existing?.units?.map((u: any) => ({
      unitName: u.unitName,
      topicsText: (u.topics || []).map((t: any) => `${t.topicName}${(t.learningObjectives||[]).length ? ' :: ' + t.learningObjectives.join(' | ') : ''}`).join('\n'),
    })) || [{ unitName: '', topicsText: '' }]
  );

  const parsedUnits = units.filter(u => u.unitName.trim()).map((u, ui) => ({
    unitNo: ui + 1,
    unitName: u.unitName.trim(),
    topics: u.topicsText.split('\n').map(l => l.trim()).filter(Boolean).map((line, ti) => {
      const [namePart, objPart] = line.split('::');
      return {
        topicNo: ti + 1,
        topicName: (namePart || line).trim(),
        learningObjectives: objPart ? objPart.split('|').map(o => o.trim()).filter(Boolean) : [],
      };
    }),
  }));
  const totalTopics = parsedUnits.reduce((sum, u) => sum + u.topics.length, 0);

  const downloadTemplate = async () => {
    try {
      const blob = await syllabusService.downloadSloTemplateFillIn();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'slo-template-fill-in.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const [uploading, setUploading] = useState(false);
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { units: parsed } = await syllabusService.parseSloTemplateUpload(file);
      // Convert the parsed structure back into this form's editable
      // text-per-unit shape, so the coordinator can review and adjust
      // before saving - never auto-saved directly from the upload.
      setUnits(parsed.map((u: any) => ({
        unitName: u.unitName,
        topicsText: u.topics.map((t: any) => `${t.topicName}${t.learningObjectives.length ? ' :: ' + t.learningObjectives.join(' | ') : ''}`).join('\n'),
      })));
      toast.success(`Parsed ${parsed.length} unit(s) — review below before saving`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to parse the uploaded file');
    } finally {
      setUploading(false);
    }
  };

  const mut = useMutation({
    mutationFn: () => existing
      ? syllabusService.updateSloTemplate(existing._id, { ...form, units: parsedUnits })
      : syllabusService.createSloTemplate({ ...form, units: parsedUnits }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['slo-templates-all'] }); toast.success(existing?'Template updated':'Template created'); onClose(); },
    onError: (e:any) => toast.error(e?.response?.data?.message||'Failed'),
  });

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:'12px',width:'640px',maxHeight:'88vh',overflowY:'auto'}}>
        <div style={{background:'#0C447C',color:'#fff',padding:'16px 20px',borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between'}}>
          <div style={{fontWeight:600}}>{existing?'Edit':'New'} SLO Template</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#fff',fontSize:'20px',cursor:'pointer'}}>×</button>
        </div>
        <div style={{padding:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Subject*</label>
              <select value={form.subjectName} onChange={e=>setForm(p=>({...p,subjectName:e.target.value}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
                <option value="">Select subject</option>
                {(subjects||[]).map((s:any)=><option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <GradeLevelDropdown label="Grade Level*" value={form.gradeLevel} onChange={v=>setForm(p=>({...p,gradeLevel:v}))} />
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Framework*</label>
              <select value={form.framework} onChange={e=>setForm(p=>({...p,framework:e.target.value}))}
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}>
                {FRAMEWORKS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Source Document</label>
              <input value={form.sourceDocument} onChange={e=>setForm(p=>({...p,sourceDocument:e.target.value}))}
                placeholder="e.g. SNC Mathematics Grade 3, MoFEPT, 2020"
                style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
            </div>
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Source Notes (optional)</label>
            <input value={form.sourceNotes} onChange={e=>setForm(p=>({...p,sourceNotes:e.target.value}))}
              placeholder="e.g. page 12-34, or a link to the official document"
              style={{width:'100%',padding:'8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
            <div style={{borderLeft:'3px solid #EF9F27',paddingLeft:'10px',fontWeight:600,color:'#0C447C',fontSize:'12px',textTransform:'uppercase' as const}}>Units & Topics</div>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={downloadTemplate} style={{fontSize:'11px',color:'#0C447C',background:'#EBF2FA',border:'none',borderRadius:'6px',padding:'5px 10px',cursor:'pointer'}}>
                ⬇ Download Fill-In Template
              </button>
              <label style={{fontSize:'11px',color:'#7F77DD',background:'#F1F0FC',border:'none',borderRadius:'6px',padding:'5px 10px',cursor:'pointer'}}>
                {uploading?'Parsing…':'⬆ Upload Filled Template'}
                <input type="file" accept=".xlsx,.xls" style={{display:'none'}} disabled={uploading}
                  onChange={e=>{const f=e.target.files?.[0]; if(f) handleUpload(f); e.target.value='';}}/>
              </label>
            </div>
          </div>
          <div style={{fontSize:'11px',color:'#999',marginBottom:'10px'}}>
            Download the template, fill it in directly from your real source document, then upload it back - it'll be parsed into the units below for you to review before saving. Or type directly below: one topic per line, with learning objectives after "::" separated by "|" - e.g. <code>Fractions :: Add fractions with like denominators | Compare fraction sizes</code>
          </div>
          {units.map((u, i) => (
            <div key={i} style={{background:'#f8f9fa',borderRadius:'8px',padding:'12px',marginBottom:'10px'}}>
              <div style={{display:'flex',gap:'8px',marginBottom:'6px'}}>
                <input value={u.unitName} onChange={e=>setUnits(prev=>prev.map((x,xi)=>xi===i?{...x,unitName:e.target.value}:x))}
                  placeholder={`Unit ${i+1} name`}
                  style={{flex:1,padding:'7px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'13px'}}/>
                {units.length>1&&<button onClick={()=>setUnits(prev=>prev.filter((_,xi)=>xi!==i))} style={{padding:'0 10px',border:'none',background:'none',color:'#E24B4A',cursor:'pointer',fontSize:'13px'}}>✕</button>}
              </div>
              <textarea value={u.topicsText} onChange={e=>setUnits(prev=>prev.map((x,xi)=>xi===i?{...x,topicsText:e.target.value}:x))}
                placeholder={'Topic 1 :: objective 1 | objective 2\nTopic 2 :: objective 1'}
                rows={3}
                style={{width:'100%',padding:'7px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',resize:'vertical' as const,fontFamily:'monospace',boxSizing:'border-box' as const}}/>
            </div>
          ))}
          <button onClick={()=>setUnits(prev=>[...prev,{unitName:'',topicsText:''}])}
            style={{fontSize:'12px',color:'#0C447C',background:'none',border:'none',cursor:'pointer',padding:0,marginBottom:'16px'}}>
            + Add Unit
          </button>

          <div style={{fontSize:'11px',color:'#888',marginBottom:'12px'}}>{parsedUnits.length} unit(s), {totalTopics} topic(s) will be saved</div>

          <label style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',cursor:'pointer'}}>
            <input type="checkbox" checked={form.isVerified} onChange={e=>setForm(p=>({...p,isVerified:e.target.checked}))}/>
            <span style={{fontSize:'12px',color:'#555'}}>I've confirmed this content against the real source document named above</span>
          </label>

          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={onClose} style={{flex:1,padding:'10px',background:'#f5f5f5',color:'#666',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>Cancel</button>
            <button onClick={()=>mut.mutate()} disabled={!form.subjectName||!form.gradeLevel||totalTopics===0||mut.isPending}
              style={{flex:1,padding:'10px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px',opacity:(!form.subjectName||!form.gradeLevel||totalTopics===0)?0.5:1}}>
              {mut.isPending?'Saving...':existing?'Save Changes':'Create Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimetableIntelligenceTab() {
  const [section, setSection] = useState('planner');
  const qc = useQueryClient();

  const { data: timetables = [] } = useQuery({ queryKey: ['timetables'], queryFn: () => api.get('/teaching/timetable').then(r => r.data) });
  const { data: teachers = [] } = useQuery({ queryKey: ['teaching-teachers'], queryFn: () => api.get('/teaching/teachers').then(r => r.data) });
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDay = new Date().getDay();
  const { data: todayAtt = [] } = useQuery({ queryKey: ['att-today', todayStr], queryFn: () => api.get('/hr/attendance', { params: { date: todayStr } }).then(r => r.data) });

  const absentTeachers = (todayAtt as any[]).filter((a:any) => a.status === 'absent');
  const totalPeriods = (timetables as any[]).reduce((s:number,tt:any) => s + (tt.periods?.length||0), 0);

  const conflicts: any[] = [];
  (timetables as any[]).forEach((tt:any) => {
    (tt.periods||[]).forEach((p:any) => {
      if (!p.teacherId && !p.teacherName) return;
      (timetables as any[]).forEach((tt2:any) => {
        if (tt2._id === tt._id) return;
        const clash = (tt2.periods||[]).find((p2:any) => p2.day===p.day && p2.periodNo===p.periodNo && p2.teacherName===p.teacherName && p2.teacherName);
        if (clash) conflicts.push({ teacher:p.teacherName, day:p.day, period:p.periodNo, class1:`${tt.gradeLevel} ${tt.sectionName}`, class2:`${tt2.gradeLevel} ${tt2.sectionName}` });
      });
    });
  });
  const uniqueConflicts = conflicts.filter((c,i) => conflicts.findIndex(x=>x.teacher===c.teacher&&x.day===c.day&&x.period===c.period)===i);

  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const PERIOD_TIMES = ['08:00','08:40','09:20','10:00','10:40','11:20','12:00','12:40'];
  const subjectColor = (subj:string) => {
    const s=(subj||'').toLowerCase();
    if(s.includes('math')) return {bg:'#dbeafe',text:'#1d4ed8'};
    if(s.includes('eng')) return {bg:'#dcfce7',text:'#166534'};
    if(s.includes('sci')||s.includes('phys')||s.includes('chem')||s.includes('bio')) return {bg:'#f0fdf4',text:'#15803d'};
    if(s.includes('islam')||s.includes('arab')) return {bg:'#d1fae5',text:'#065f46'};
    if(s.includes('urdu')) return {bg:'#fef9c3',text:'#854d0e'};
    if(s.includes('pe')||s.includes('sport')) return {bg:'#ffedd5',text:'#c2410c'};
    if(s.includes('comp')||s.includes('it')) return {bg:'#e0e7ff',text:'#4338ca'};
    return {bg:'#f1f5f9',text:'#475569'};
  };

  const navItems = [
    {id:'planner',label:'Timetable Planner',icon:'📅'},
    {id:'teachers',label:'Teacher Scheduling',icon:'👨‍🏫'},
    {id:'rooms',label:'Room Allocation',icon:'🏢'},
    {id:'substitutes',label:'Substitutes',icon:'🔄'},
    {id:'workload',label:'Workload Intel',icon:'📊'},
    {id:'reports',label:'Reports',icon:'📈'},
    {id:'settings',label:'Settings',icon:'⚙️'},
  ];

  return (
    <div style={{display:'flex',height:'calc(100vh - 100px)'}}>
      <div style={{width:'180px',background:'#fff',borderRight:'1px solid #e5e7eb',flexShrink:0,overflowY:'auto'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid #e5e7eb'}}>
          <div style={{fontSize:'12px',fontWeight:600,color:'#0C447C'}}>📅 Timetable AI</div>
          <div style={{fontSize:'11px',color:'#888'}}>Intelligence Module</div>
        </div>
        {navItems.map(n=>(
          <button key={n.id} onClick={()=>setSection(n.id)}
            style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'9px 14px',background:section===n.id?'#EBF2FA':'none',color:section===n.id?'#0C447C':'#666',border:'none',borderLeft:section===n.id?'2px solid #378ADD':'2px solid transparent',cursor:'pointer',fontSize:'12px',textAlign:'left' as const}}>
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'16px',background:'#f8f9fa'}}>

        {section==='planner' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Timetable Planner</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>View and manage all class timetables</div>

            {uniqueConflicts.length>0 && (
              <div style={{background:'#fdecea',border:'1px solid #E24B4A33',borderRadius:'8px',padding:'12px',marginBottom:'14px'}}>
                <div style={{fontWeight:600,color:'#E24B4A',marginBottom:'6px'}}>⚠ {uniqueConflicts.length} Conflict{uniqueConflicts.length>1?'s':''} Detected</div>
                {uniqueConflicts.slice(0,3).map((c,i)=>(
                  <div key={i} style={{fontSize:'12px',color:'#E24B4A',marginBottom:'3px'}}>{c.teacher} — {c.class1} AND {c.class2} — Day {c.day} P{c.period}</div>
                ))}
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'16px'}}>
              {[
                {l:'Timetables',v:(timetables as any[]).length,c:'#0C447C'},
                {l:'Total Periods',v:totalPeriods,c:'#1D9E75'},
                {l:'Conflicts',v:uniqueConflicts.length,c:uniqueConflicts.length>0?'#E24B4A':'#1D9E75'},
                {l:'Active',v:(timetables as any[]).filter((t:any)=>t.status==='active').length,c:'#378ADD'},
              ].map(s=>(
                <div key={s.l} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'12px',borderTop:`3px solid ${s.c}`}}>
                  <div style={{fontSize:'22px',fontWeight:700,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:'11px',color:'#888'}}>{s.l}</div>
                </div>
              ))}
            </div>

            {(timetables as any[]).length===0 ? (
              <div style={{padding:'60px',textAlign:'center' as const,color:'#888',background:'#fff',borderRadius:'8px'}}>
                <div style={{fontSize:'40px',marginBottom:'8px'}}>📅</div>
                <div style={{fontWeight:500,marginBottom:'12px'}}>No timetables created yet</div>
                <div style={{fontSize:'12px',color:'#0C447C',cursor:'pointer',textDecoration:'underline'}} onClick={()=>window.location.href='/teaching'}>→ Go to Teaching Management to create timetables</div>
              </div>
            ):(timetables as any[]).map((tt:any)=>(
              <div key={tt._id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',marginBottom:'16px',overflow:'hidden'}}>
                <div style={{padding:'10px 16px',background:'#f8f9fa',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #e5e7eb'}}>
                  <div>
                    <span style={{fontWeight:600,color:'#0C447C'}}>{tt.gradeLevel} — Section {tt.sectionName}</span>
                    <span style={{marginLeft:'8px',fontSize:'12px',color:'#888'}}>{tt.academicYearLabel||'2025-2026'}</span>
                    <span style={{marginLeft:'8px',padding:'2px 8px',background:tt.status==='active'?'#e6f7ed':'#f5f5f5',color:tt.status==='active'?'#1D9E75':'#888',borderRadius:'99px',fontSize:'11px'}}>{tt.status}</span>
                  </div>
                  <button onClick={()=>window.print()} style={{padding:'4px 10px',border:'1px solid #e5e7eb',borderRadius:'4px',background:'#fff',cursor:'pointer',fontSize:'11px'}}>🖨 Print</button>
                </div>
                <div style={{overflowX:'auto',padding:'12px'}}>
                  <table style={{borderCollapse:'collapse',width:'100%',minWidth:'500px',fontSize:'11px'}}>
                    <thead>
                      <tr>
                        <th style={{padding:'6px',background:'#f8f9fa',border:'1px solid #e5e7eb',color:'#666',width:'65px',textAlign:'left' as const}}>Period</th>
                        {(tt.workingDays||[1,2,3,4,5]).map((d:number)=>(
                          <th key={d} style={{padding:'6px',background:'#0C447C',color:'#fff',border:'1px solid #0C447C',textAlign:'center' as const,minWidth:'100px'}}>{DAYS[d-1]||`Day ${d}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length:tt.periodsPerDay||8},(_,i)=>i+1).map(p=>(
                        <tr key={p}>
                          <td style={{padding:'6px',background:'#f8f9fa',border:'1px solid #e5e7eb',color:'#0C447C',fontWeight:500,verticalAlign:'top' as const}}>
                            <div>P{p}</div>
                            <div style={{fontSize:'9px',color:'#aaa'}}>{PERIOD_TIMES[p-1]||''}</div>
                          </td>
                          {(tt.workingDays||[1,2,3,4,5]).map((d:number)=>{
                            const cell=(tt.periods||[]).find((x:any)=>x.day===d&&x.periodNo===p);
                            const hasConflict=uniqueConflicts.some(c=>c.day===d&&c.period===p&&(c.class1===`${tt.gradeLevel} ${tt.sectionName}`||c.class2===`${tt.gradeLevel} ${tt.sectionName}`));
                            const col=cell?subjectColor(cell.subject):null;
                            return (
                              <td key={d} style={{padding:'4px',border:'1px solid #e5e7eb',background:hasConflict?'#fdecea':col?col.bg:'#fafafa',verticalAlign:'top' as const,position:'relative' as const}}>
                                {cell?(
                                  cell.type==='break'?<div style={{textAlign:'center' as const,color:'#aaa',fontSize:'10px',padding:'8px 0'}}>Break</div>:
                                  <div>
                                    {hasConflict&&<div style={{position:'absolute' as const,top:'3px',right:'3px',width:'6px',height:'6px',background:'#E24B4A',borderRadius:'50%'}}/>}
                                    <div style={{fontWeight:600,color:col?.text,fontSize:'11px'}}>{cell.subject}</div>
                                    <div style={{fontSize:'10px',color:'#888',marginTop:'1px'}}>{cell.teacherName}</div>
                                    {cell.roomNo&&<div style={{fontSize:'9px',color:'#aaa'}}>Rm {cell.roomNo}</div>}
                                  </div>
                                ):<div style={{textAlign:'center' as const,color:'#ddd',fontSize:'10px',padding:'8px 0'}}>—</div>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {section==='teachers' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Teacher Scheduling</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>Teacher availability and period distribution across all timetables</div>
            {(teachers as any[]).length===0?(
              <div style={{padding:'60px',textAlign:'center' as const,color:'#888',background:'#fff',borderRadius:'8px'}}>No teacher profiles found. Add teachers in Teaching Management first.</div>
            ):(
              <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid #e5e7eb',fontWeight:600,color:'#0C447C',fontSize:'13px'}}>Weekly Period Distribution</div>
                <div style={{overflowX:'auto',padding:'12px'}}>
                  <table style={{borderCollapse:'collapse',fontSize:'12px',width:'100%'}}>
                    <thead>
                      <tr style={{background:'#f8f9fa'}}>
                        <th style={{padding:'8px 10px',textAlign:'left' as const,borderBottom:'1px solid #e5e7eb',color:'#666',minWidth:'130px'}}>Teacher</th>
                        {['Mon','Tue','Wed','Thu','Fri'].map(d=>(
                          <th key={d} style={{padding:'8px',textAlign:'center' as const,borderBottom:'1px solid #e5e7eb',color:'#666',minWidth:'70px'}}>{d}</th>
                        ))}
                        <th style={{padding:'8px',textAlign:'center' as const,borderBottom:'1px solid #e5e7eb',color:'#666'}}>Total/Week</th>
                        <th style={{padding:'8px',textAlign:'center' as const,borderBottom:'1px solid #e5e7eb',color:'#666'}}>Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teachers as any[]).map((t:any)=>{
                        const name=`${t.firstName} ${t.lastName}`;
                        const dayPeriods=[1,2,3,4,5].map(d=>(timetables as any[]).reduce((s:number,tt:any)=>s+(tt.periods||[]).filter((p:any)=>p.day===d&&p.teacherName===name).length,0));
                        const total=dayPeriods.reduce((s,n)=>s+n,0);
                        const max=t.maxPeriodsPerWeek||30;
                        const pct=Math.round((total/max)*100);
                        const color=pct>90?'#E24B4A':pct>70?'#BA7517':'#1D9E75';
                        return (
                          <tr key={t._id} style={{borderBottom:'1px solid #f0f0f0'}}>
                            <td style={{padding:'8px 10px'}}>
                              <div style={{fontWeight:500,fontSize:'13px'}}>{name}</div>
                              <div style={{fontSize:'10px',color:'#888'}}>{t.designation||'Teacher'}</div>
                            </td>
                            {dayPeriods.map((cnt,i)=>(
                              <td key={i} style={{padding:'6px',textAlign:'center' as const}}>
                                {cnt>0?<span style={{padding:'3px 8px',background:'#EBF2FA',color:'#0C447C',borderRadius:'99px',fontSize:'11px',fontWeight:500}}>{cnt}</span>:<span style={{color:'#e0e0e0',fontSize:'12px'}}>—</span>}
                              </td>
                            ))}
                            <td style={{padding:'8px',textAlign:'center' as const,fontWeight:600,color}}>
                              {total}/{max}
                            </td>
                            <td style={{padding:'8px',minWidth:'100px'}}>
                              <div style={{height:'6px',background:'#f0f0f0',borderRadius:'3px'}}>
                                <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:color,borderRadius:'3px'}}/>
                              </div>
                              <div style={{fontSize:'10px',color,marginTop:'2px',textAlign:'right' as const}}>{pct}%</div>
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
        )}

        {section==='rooms' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Room Allocation</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>Track room usage across all timetables by period</div>
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid #e5e7eb',fontWeight:600,color:'#0C447C',fontSize:'13px'}}>Room Occupancy Matrix</div>
              <div style={{overflowX:'auto',padding:'12px'}}>
                {(()=>{
                  const rooms=[...new Set((timetables as any[]).flatMap((tt:any)=>(tt.periods||[]).map((p:any)=>p.roomNo).filter(Boolean)))] as string[];
                  if(rooms.length===0) return (
                    <div style={{padding:'40px',textAlign:'center' as const,color:'#aaa'}}>
                      <div style={{fontSize:'32px',marginBottom:'8px'}}>🏢</div>
                      <div>No rooms assigned yet</div>
                      <div style={{fontSize:'12px',marginTop:'4px'}}>Assign room numbers when editing timetable periods</div>
                    </div>
                  );
                  const days=[1,2,3,4,5];
                  const periods=Array.from({length:8},(_,i)=>i+1);
                  return (
                    <table style={{borderCollapse:'collapse',fontSize:'11px',minWidth:'600px'}}>
                      <thead>
                        <tr>
                          <th style={{padding:'8px',textAlign:'left' as const,borderBottom:'1px solid #e5e7eb',color:'#666',minWidth:'90px',background:'#f8f9fa'}}>Room</th>
                          {days.map(d=>periods.map(p=>(
                            <th key={`${d}${p}`} style={{padding:'4px 2px',textAlign:'center' as const,borderBottom:'1px solid #e5e7eb',color:'#aaa',fontSize:'9px',minWidth:'35px',background:'#f8f9fa'}}>
                              {['M','T','W','T','F'][d-1]}P{p}
                            </th>
                          )))}
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map(room=>(
                          <tr key={room} style={{borderBottom:'1px solid #f0f0f0'}}>
                            <td style={{padding:'8px',fontWeight:500,color:'#0C447C'}}>Room {room}</td>
                            {days.flatMap(d=>periods.map(p=>{
                              const tt=(timetables as any[]).find((x:any)=>(x.periods||[]).some((per:any)=>per.day===d&&per.periodNo===p&&per.roomNo===room));
                              const per=tt&&(tt.periods||[]).find((per:any)=>per.day===d&&per.periodNo===p&&per.roomNo===room);
                              return (
                                <td key={`${d}${p}`} style={{padding:'2px',textAlign:'center' as const}}>
                                  {per?(
                                    <div style={{padding:'2px 3px',background:'#EBF2FA',color:'#0C447C',borderRadius:'3px',fontSize:'9px',lineHeight:1.2}}>
                                      {(per.subject||'').substring(0,4)}<br/>{(tt.gradeLevel||'').replace('Grade ','')}
                                    </div>
                                  ):<div style={{height:'24px',background:'#f9f9f9',borderRadius:'2px'}}/>}
                                </td>
                              );
                            }))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {section==='substitutes' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Substitute Management</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>Find free teachers to cover absent staff today — {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</div>
            {absentTeachers.length===0?(
              <div style={{padding:'60px',textAlign:'center' as const,color:'#888',background:'#fff',borderRadius:'8px'}}>
                <div style={{fontSize:'40px',marginBottom:'8px'}}>✅</div>
                <div style={{fontWeight:500}}>All teachers present today</div>
                <div style={{fontSize:'12px',marginTop:'4px',color:'#aaa'}}>No substitutes needed</div>
              </div>
            ):(
              <div>
                <div style={{background:'#fdecea',border:'1px solid #E24B4A33',borderRadius:'8px',padding:'12px',marginBottom:'14px'}}>
                  <span style={{fontWeight:600,color:'#E24B4A'}}>⚠ {absentTeachers.length} teacher{absentTeachers.length>1?'s':''} absent today</span>
                  <span style={{fontSize:'12px',color:'#E24B4A',marginLeft:'8px'}}>Check timetable for affected classes</span>
                </div>
                {absentTeachers.map((att:any)=>{
                  const absentName=att.staffName||att.staffId;
                  const affectedPeriods=(timetables as any[]).flatMap((tt:any)=>
                    (tt.periods||[]).filter((p:any)=>p.teacherName===absentName&&p.day===todayDay).map((p:any)=>({...p,grade:tt.gradeLevel,section:tt.sectionName,ttId:tt._id}))
                  );
                  const freeTeachers=(teachers as any[]).filter((t:any)=>{
                    const name=`${t.firstName} ${t.lastName}`;
                    return !absentTeachers.some((a:any)=>(a.staffName||a.staffId)===name);
                  });
                  return (
                    <div key={att._id||att.staffId} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',marginBottom:'12px',overflow:'hidden'}}>
                      <div style={{padding:'10px 16px',background:'#fff8f8',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <span style={{fontWeight:600,color:'#E24B4A'}}>👤 {absentName}</span>
                          <span style={{fontSize:'12px',color:'#888',marginLeft:'8px'}}>{affectedPeriods.length} period{affectedPeriods.length!==1?'s':''} need coverage</span>
                        </div>
                        <span style={{padding:'2px 8px',background:'#fdecea',color:'#E24B4A',borderRadius:'99px',fontSize:'11px'}}>Absent</span>
                      </div>
                      {affectedPeriods.length===0?(
                        <div style={{padding:'14px 16px',fontSize:'12px',color:'#aaa',textAlign:'center' as const}}>No periods assigned today</div>
                      ):affectedPeriods.map((p:any,i:number)=>{
                        const freePeriodTeachers=freeTeachers.filter((t:any)=>{
                          const name=`${t.firstName} ${t.lastName}`;
                          return !(timetables as any[]).some((tt:any)=>(tt.periods||[]).some((per:any)=>per.day===todayDay&&per.periodNo===p.periodNo&&per.teacherName===name));
                        });
                        return (
                          <div key={i} style={{padding:'10px 16px',borderBottom:'1px solid #f5f5f5',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
                            <div>
                              <div style={{fontWeight:500,fontSize:'13px'}}>Period {p.periodNo} — {p.subject}</div>
                              <div style={{fontSize:'11px',color:'#888'}}>{p.grade} {p.section}{p.roomNo?` • Room ${p.roomNo}`:''}</div>
                            </div>
                            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                              <select style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px',color:'#0C447C',minWidth:'160px'}}>
                                <option value="">— Assign substitute —</option>
                                {freePeriodTeachers.map((t:any)=>(
                                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName} (free)</option>
                                ))}
                                {freePeriodTeachers.length===0&&<option disabled>No free teachers at P{p.periodNo}</option>}
                              </select>
                              <button onClick={()=>toast.success('Substitute assigned successfully')}
                                style={{padding:'5px 12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'11px'}}>
                                Assign
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {section==='workload' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Workload Intelligence</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>Teacher workload analysis — periods per week vs capacity</div>
            {(teachers as any[]).length===0?(
              <div style={{padding:'60px',textAlign:'center' as const,color:'#888',background:'#fff',borderRadius:'8px'}}>No teachers found. Add teacher profiles first.</div>
            ):(
              <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'16px'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'16px'}}>
                  {(()=>{
                    const overloaded=(teachers as any[]).filter((t:any)=>{
                      const name=`${t.firstName} ${t.lastName}`;
                      const total=(timetables as any[]).reduce((s:number,tt:any)=>s+(tt.periods||[]).filter((p:any)=>p.teacherName===name).length,0);
                      return total>(t.maxPeriodsPerWeek||30)*0.9;
                    }).length;
                    const underutilized=(teachers as any[]).filter((t:any)=>{
                      const name=`${t.firstName} ${t.lastName}`;
                      const total=(timetables as any[]).reduce((s:number,tt:any)=>s+(tt.periods||[]).filter((p:any)=>p.teacherName===name).length,0);
                      return total<(t.maxPeriodsPerWeek||30)*0.5;
                    }).length;
                    return [
                      {l:'Total Teachers',v:(teachers as any[]).length,c:'#0C447C'},
                      {l:'Overloaded (>90%)',v:overloaded,c:overloaded>0?'#E24B4A':'#1D9E75'},
                      {l:'Underutilized (<50%)',v:underutilized,c:underutilized>0?'#BA7517':'#1D9E75'},
                    ].map(s=>(
                      <div key={s.l} style={{background:'#f8f9fa',borderRadius:'8px',padding:'12px',borderTop:`3px solid ${s.c}`}}>
                        <div style={{fontSize:'22px',fontWeight:700,color:s.c}}>{s.v}</div>
                        <div style={{fontSize:'11px',color:'#888'}}>{s.l}</div>
                      </div>
                    ));
                  })()}
                </div>
                <div style={{borderLeft:'3px solid #EF9F27',paddingLeft:'10px',fontWeight:600,color:'#0C447C',marginBottom:'14px',fontSize:'13px'}}>
                  Teacher Workload Bars
                </div>
                {(teachers as any[]).map((t:any)=>{
                  const name=`${t.firstName} ${t.lastName}`;
                  const total=(timetables as any[]).reduce((s:number,tt:any)=>s+(tt.periods||[]).filter((p:any)=>p.teacherName===name).length,0);
                  const max=t.maxPeriodsPerWeek||30;
                  const pct=Math.round((total/max)*100);
                  const color=pct>90?'#E24B4A':pct>70?'#EF9F27':'#1D9E75';
                  return (
                    <div key={t._id} style={{marginBottom:'14px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                        <div>
                          <span style={{fontWeight:500,fontSize:'13px'}}>{name}</span>
                          <span style={{fontSize:'11px',color:'#888',marginLeft:'8px'}}>{t.designation||'Teacher'}</span>
                          {(t.subjectsCanTeach||[]).slice(0,2).map((s:string)=>(
                            <span key={s} style={{marginLeft:'4px',padding:'1px 6px',background:'#FFF3DC',color:'#BA7517',borderRadius:'99px',fontSize:'9px'}}>{s}</span>
                          ))}
                        </div>
                        <span style={{fontSize:'12px',fontWeight:600,color}}>{total}/{max} ({pct}%)</span>
                      </div>
                      <div style={{height:'22px',background:'#f0f0f0',borderRadius:'4px',overflow:'hidden',position:'relative' as const}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:color,borderRadius:'4px',display:'flex',alignItems:'center',paddingLeft:'8px',transition:'width 0.4s'}}>
                          {pct>15&&<span style={{fontSize:'10px',color:'#fff',fontWeight:500}}>{total} periods</span>}
                        </div>
                        <div style={{position:'absolute' as const,top:0,left:'90%',width:'2px',height:'100%',background:'#E24B4A',opacity:0.4}}/>
                      </div>
                      {pct>90&&<div style={{fontSize:'11px',color:'#E24B4A',marginTop:'3px'}}>⚠ Overloaded — consider redistributing some periods</div>}
                      {total===0&&<div style={{fontSize:'11px',color:'#aaa',marginTop:'3px'}}>No periods assigned yet</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {section==='reports' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Reports & Analytics</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>Export and print timetable reports</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              {[
                {icon:'📅',name:'Per-Class Timetable',desc:`Print timetable for each of ${(timetables as any[]).length} classes`,action:()=>window.print()},
                {icon:'👨‍🏫',name:'Per-Teacher Schedule',desc:`Print schedule for each of ${(teachers as any[]).length} teachers`,action:()=>window.print()},
                {icon:'🏢',name:'Room Usage Report',desc:'Show room occupancy by period',action:()=>setSection('rooms')},
                {icon:'📊',name:'Workload Report',desc:'Teacher workload distribution chart',action:()=>setSection('workload')},
                {icon:'⚠️',name:'Conflict Report',desc:`${uniqueConflicts.length} conflict${uniqueConflicts.length!==1?'s':''} found`,action:()=>setSection('planner')},
                {icon:'🔄',name:'Substitute Report',desc:`${absentTeachers.length} absent today`,action:()=>setSection('substitutes')},
              ].map(r=>(
                <button key={r.name} onClick={r.action}
                  style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',cursor:'pointer',textAlign:'left' as const,width:'100%'}}>
                  <div style={{fontSize:'28px',flexShrink:0}}>{r.icon}</div>
                  <div>
                    <div style={{fontWeight:500,fontSize:'13px',color:'#333'}}>{r.name}</div>
                    <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{r.desc}</div>
                  </div>
                  <div style={{marginLeft:'auto',color:'#aaa',fontSize:'16px'}}>→</div>
                </button>
              ))}
            </div>
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'16px'}}>
              <div style={{borderLeft:'3px solid #EF9F27',paddingLeft:'10px',fontWeight:600,color:'#0C447C',marginBottom:'12px',fontSize:'13px'}}>Summary Statistics</div>
              {[
                {l:'Total Timetables Created',v:(timetables as any[]).length},
                {l:'Total Periods Scheduled',v:totalPeriods},
                {l:'Active Timetables',v:(timetables as any[]).filter((t:any)=>t.status==='active').length},
                {l:'Draft Timetables',v:(timetables as any[]).filter((t:any)=>t.status==='draft').length},
                {l:'Scheduling Conflicts',v:uniqueConflicts.length},
                {l:'Teachers Tracked',v:(teachers as any[]).length},
              ].map(s=>(
                <div key={s.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f5f5f5'}}>
                  <span style={{fontSize:'13px',color:'#555'}}>{s.l}</span>
                  <span style={{fontWeight:600,color:'#0C447C'}}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section==='settings' && (
          <div>
            <div style={{fontSize:'16px',fontWeight:600,color:'#0C447C',marginBottom:'4px'}}>Timetable Settings</div>
            <div style={{fontSize:'12px',color:'#888',marginBottom:'14px'}}>Configure default timetable rules and constraints</div>
            <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'16px'}}>
              <div style={{borderLeft:'3px solid #EF9F27',paddingLeft:'10px',fontWeight:600,color:'#0C447C',marginBottom:'14px',fontSize:'13px'}}>Schedule Configuration</div>
              {[
                {l:'School Start Time',desc:'Default start time for Period 1',ctrl:<input type="time" defaultValue="08:00" style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px'}}/>},
                {l:'Period Duration (mins)',desc:'Default duration per teaching period',ctrl:<input type="number" defaultValue="40" min="20" max="90" style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px',width:'70px'}}/>},
                {l:'Break After Period',desc:'Insert break after which period',ctrl:<select style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px'}}>{[3,4,5,6].map(n=><option key={n} value={n}>After Period {n}</option>)}</select>},
                {l:'Break Duration (mins)',desc:'Duration of mid-session break',ctrl:<input type="number" defaultValue="20" style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px',width:'70px'}}/>},
                {l:'Max Periods Per Day',desc:'Maximum teaching periods per day',ctrl:<input type="number" defaultValue="8" min="4" max="12" style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px',width:'70px'}}/>},
                {l:'Fine Per Day (Library)',desc:'Fine amount for overdue library books',ctrl:<input type="number" defaultValue="5" style={{padding:'5px 8px',border:'1px solid #e5e7eb',borderRadius:'4px',fontSize:'12px',width:'70px'}}/>},
              ].map(s=>(
                <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #f5f5f5'}}>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:500}}>{s.l}</div>
                    <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{s.desc}</div>
                  </div>
                  {s.ctrl}
                </div>
              ))}
              <div style={{marginTop:'16px',display:'flex',gap:'8px'}}>
                <button onClick={()=>toast.success('Settings saved successfully')}
                  style={{padding:'8px 20px',background:'#0C447C',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
                  Save Settings
                </button>
                <button onClick={()=>toast.success('Settings reset to defaults')}
                  style={{padding:'8px 20px',background:'#fff',color:'#666',border:'1px solid #e5e7eb',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
                  Reset Defaults
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function AddBookModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title:'', author:'', isbn:'', publisher:'', publishYear: new Date().getFullYear(), edition:'', category:'textbook', totalCopies:1, accessionNo:'', shelfNo:'', location:'', purchasePrice:0, language:'English', description:'', gradeLevels:[] as string[] });
  const mut = useMutation({
    mutationFn: academicsService.createBook,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books','library-stats'] }); toast.success('Book added to library'); onClose(); },
    onError: (e:any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'12px', width:'600px', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ background:'#0C447C', color:'#fff', padding:'16px 20px', borderRadius:'12px 12px 0 0', display:'flex', justifyContent:'space-between' }}>
          <div style={{ fontWeight:600 }}>Add Book to Library</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', fontSize:'18px', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Title*</label>
              <input value={form.title} onChange={e => setForm(prev => ({...prev, title:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Author*</label>
              <input value={form.author} onChange={e => setForm(prev => ({...prev, author:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>ISBN</label>
              <input value={form.isbn} onChange={e => setForm(prev => ({...prev, isbn:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Publisher</label>
              <input value={form.publisher} onChange={e => setForm(prev => ({...prev, publisher:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Category*</label>
              <select value={form.category} onChange={e => setForm(prev => ({...prev, category:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px' }}>
                {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Total Copies*</label>
              <input type="number" value={form.totalCopies} onChange={e => setForm(prev => ({...prev, totalCopies:parseInt(e.target.value)||1}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Shelf No</label>
              <input value={form.shelfNo} onChange={e => setForm(prev => ({...prev, shelfNo:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Purchase Price</label>
              <input type="number" value={form.purchasePrice} onChange={e => setForm(prev => ({...prev, purchasePrice:parseFloat(e.target.value)||0}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' as const }} />
            </div>
          </div>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'6px' }}>Grade Levels</label>
            <GradeCheckboxGrid selected={form.gradeLevels} onChange={v=>setForm(prev=>({...prev,gradeLevels:v}))} />
          </div>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({...prev, description:e.target.value}))} rows={2} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', resize:'vertical', boxSizing:'border-box' as const }} />
          </div>
          <button onClick={() => mut.mutate(form)} disabled={!form.title || !form.author || mut.isPending}
            style={{ width:'100%', padding:'10px', background:'#0C447C', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', opacity: (!form.title || !form.author || mut.isPending) ? 0.6 : 1 }}>
            {mut.isPending ? 'Adding...' : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueBookModal({ book, onClose }: { book: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [borrowerType, setBorrowerType] = useState<'student'|'staff'>('student');
  const [loanDays, setLoanDays] = useState(14);
  const [form, setForm] = useState({ borrowerName:'', borrowerAdmissionNo:'', borrowerClass:'', notes:'' });
  const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + loanDays);
  const mut = useMutation({
    mutationFn: (data: any) => academicsService.issueBook(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books','issues','library-stats'] }); toast.success(`Book issued. Due: ${dueDate.toLocaleDateString()}`); onClose(); },
    onError: (e:any) => toast.error(e?.response?.data?.message || 'Failed — check available copies'),
  });
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'12px', width:'480px' }}>
        <div style={{ background:'#0C447C', color:'#fff', padding:'16px 20px', borderRadius:'12px 12px 0 0', display:'flex', justifyContent:'space-between' }}>
          <div style={{ fontWeight:600 }}>Issue Book</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', fontSize:'18px', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ background:'#EBF2FA', borderRadius:'8px', padding:'12px', marginBottom:'16px' }}>
            <div style={{ fontWeight:600, fontSize:'14px' }}>{book.title}</div>
            <div style={{ fontSize:'12px', color:'#666' }}>{book.author} • {book.availableCopies} copies available</div>
          </div>
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
            {(['student','staff'] as const).map(t => (
              <button key={t} onClick={() => setBorrowerType(t)}
                style={{ flex:1, padding:'8px', background: borrowerType===t ? '#0C447C' : '#f5f5f5', color: borrowerType===t ? '#fff' : '#666', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', textTransform:'capitalize' as const }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Borrower Name*</label>
              <input value={form.borrowerName} onChange={e => setForm(prev => ({...prev, borrowerName:e.target.value}))} placeholder="Full name" style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px' }} />
            </div>
            {borrowerType === 'student' && <>
              <div>
                <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Admission No</label>
                <input value={form.borrowerAdmissionNo} onChange={e => setForm(prev => ({...prev, borrowerAdmissionNo:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Class/Grade</label>
                <input value={form.borrowerClass} onChange={e => setForm(prev => ({...prev, borrowerClass:e.target.value}))} style={{ width:'100%', padding:'8px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px' }} />
              </div>
            </>}
          </div>
          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'8px' }}>Loan Period</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {[7,14,30].map(d => (
                <button key={d} onClick={() => setLoanDays(d)}
                  style={{ flex:1, padding:'7px', background: loanDays===d ? '#0C447C' : '#f5f5f5', color: loanDays===d ? '#fff' : '#666', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px' }}>
                  {d} days
                </button>
              ))}
            </div>
            <div style={{ fontSize:'12px', color:'#666', marginTop:'6px' }}>Due: {dueDate.toLocaleDateString()}</div>
          </div>
          <button onClick={() => mut.mutate({ bookId:book._id, borrowerType, loanDays, ...form })} disabled={!form.borrowerName || mut.isPending}
            style={{ width:'100%', padding:'10px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>
            {mut.isPending ? 'Issuing...' : `📤 Issue Book — Due ${dueDate.toLocaleDateString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnBookModal({ issue, onClose }: { issue: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [condition, setCondition] = useState('good');
  const [finePaid, setFinePaid] = useState(false);
  const now = new Date();
  const due = new Date(issue.dueDate);
  const overdueDays = Math.max(0, Math.ceil((now.getTime() - due.getTime())/(1000*60*60*24)));
  const fine = overdueDays * 5;
  const mut = useMutation({
    mutationFn: () => academicsService.returnBook(issue._id, { condition, finePerDay:5, finePaid }),
    onSuccess: (res:any) => { qc.invalidateQueries({ queryKey: ['books','issues','overdue-books','library-stats'] }); toast.success(res.message || 'Book returned'); onClose(); },
    onError: (e:any) => toast.error(e?.response?.data?.message || 'Failed'),
  });
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'12px', width:'440px' }}>
        <div style={{ background:'#1D9E75', color:'#fff', padding:'16px 20px', borderRadius:'12px 12px 0 0', display:'flex', justifyContent:'space-between' }}>
          <div style={{ fontWeight:600 }}>Return Book</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', fontSize:'18px', cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ background:'#f9f9f9', borderRadius:'8px', padding:'12px', marginBottom:'14px' }}>
            <div style={{ fontWeight:600 }}>{issue.bookTitle}</div>
            <div style={{ fontSize:'12px', color:'#666' }}>Borrowed by: {issue.borrowerName}</div>
            <div style={{ fontSize:'12px', color:'#666' }}>Due: {new Date(issue.dueDate).toLocaleDateString()}</div>
          </div>
          {overdueDays > 0 && (
            <div style={{ background:'#fdecea', border:'1px solid #E24B4A33', borderRadius:'8px', padding:'12px', marginBottom:'14px' }}>
              <div style={{ fontWeight:600, color:'#E24B4A' }}>⚠ Overdue by {overdueDays} days</div>
              <div style={{ fontSize:'13px', color:'#E24B4A' }}>Fine: PKR {fine} ({overdueDays} × PKR 5/day)</div>
              <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', marginTop:'8px', cursor:'pointer' }}>
                <input type="checkbox" checked={finePaid} onChange={e => setFinePaid(e.target.checked)} />
                Fine collected / paid
              </label>
            </div>
          )}
          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'8px' }}>Book Condition on Return</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
              {['good','fair','damaged','lost'].map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  style={{ padding:'7px', background: condition===c ? '#0C447C' : '#f5f5f5', color: condition===c ? '#fff' : '#666', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'11px', textTransform:'capitalize' as const }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => mut.mutate()} disabled={mut.isPending}
            style={{ width:'100%', padding:'10px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>
            {mut.isPending ? 'Processing...' : '✅ Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryTab() {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<'catalogue'|'issues'|'overdue'|'reports'>('catalogue');
  const [showAddBook, setShowAddBook] = useState(false);
  const [issuingBook, setIssuingBook] = useState<any>(null);
  const [returningIssue, setReturningIssue] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [issueFilter, setIssueFilter] = useState('');

  const { data: libStats } = useQuery({ queryKey: ['library-stats'], queryFn: academicsService.getLibraryStats });
  const { data: books = [], isLoading: booksLoading } = useQuery({ queryKey: ['books', catFilter], queryFn: () => academicsService.getBooks(catFilter ? { category: catFilter } : {}) });
  const { data: issues = [] } = useQuery({ queryKey: ['issues', issueFilter], queryFn: () => academicsService.getIssues(issueFilter ? { status: issueFilter } : {}) });
  const { data: overdue = [] } = useQuery({ queryKey: ['overdue-books'], queryFn: academicsService.getOverdueIssues });

  const filtered = searchTerm ? (books as any[]).filter((b:any) => b.title?.toLowerCase().includes(searchTerm.toLowerCase()) || b.author?.toLowerCase().includes(searchTerm.toLowerCase())) : books as any[];
  const catColors: any = { textbook:'#0C447C', islamic:'#1D9E75', fiction:'#7F77DD', reference:'#BA7517', science:'#378ADD', biography:'#D85A30', children:'#E24B4A', periodical:'#888', non_fiction:'#555', other:'#aaa' };

  return (
    <div style={{ padding:'16px' }}>
      {showAddBook && <AddBookModal onClose={() => setShowAddBook(false)} />}
      {issuingBook && <IssueBookModal book={issuingBook} onClose={() => setIssuingBook(null)} />}
      {returningIssue && <ReturnBookModal issue={returningIssue} onClose={() => setReturningIssue(null)} />}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[{l:'Total Books',v:libStats?.total??0,c:'#0C447C'},{l:'Available',v:libStats?.available??0,c:'#1D9E75'},{l:'Issued',v:libStats?.issued??0,c:'#378ADD'},{l:'Overdue',v:libStats?.overdue??0,c:'#E24B4A'},{l:'Total Issues',v:libStats?.totalIssues??0,c:'#888'}].map(s => (
          <div key={s.l} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'12px', textAlign:'center' as const, borderTop:`3px solid ${s.c}` }}>
            <div style={{ fontSize:'22px', fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:'11px', color:'#888' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', flexWrap:'wrap', gap:'8px' }}>
        <div style={{ display:'flex', gap:'4px', background:'#f5f5f5', borderRadius:'8px', padding:'4px' }}>
          {(['catalogue','issues','overdue','reports'] as const).map(t => (
            <button key={t} onClick={() => setSubTab(t)}
              style={{ padding:'6px 14px', background:subTab===t?'#0C447C':'transparent', color:subTab===t?'#fff':'#666', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:subTab===t?600:400, display:'flex', alignItems:'center', gap:'4px' }}>
              {t==='overdue' && (overdue as any[]).length>0 && <span style={{ background:'#E24B4A', color:'#fff', borderRadius:'99px', padding:'0 5px', fontSize:'10px' }}>{(overdue as any[]).length}</span>}
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        {subTab==='catalogue' && (
          <div style={{ display:'flex', gap:'8px' }}>
            <input placeholder="Search title, author..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding:'7px 12px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', width:'200px' }} />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding:'7px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px' }}>
              <option value="">All Categories</option>
              {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
            </select>
            <button onClick={() => setShowAddBook(true)} style={{ padding:'7px 16px', background:'#0C447C', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px' }}>+ Add Book</button>
          </div>
        )}
        {subTab==='issues' && <select value={issueFilter} onChange={e => setIssueFilter(e.target.value)} style={{ padding:'7px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px' }}><option value="">All</option><option value="issued">Issued</option><option value="returned">Returned</option><option value="overdue">Overdue</option></select>}
      </div>

      {subTab==='catalogue' && (
        booksLoading ? <div style={{ padding:'40px', textAlign:'center' as const, color:'#888' }}>Loading...</div> :
        filtered.length===0 ? (
          <div style={{ padding:'60px', textAlign:'center' as const, color:'#888', background:'#f9f9f9', borderRadius:'8px' }}>
            <div style={{ fontSize:'40px', marginBottom:'8px' }}>🏛️</div>
            <div style={{ fontWeight:500, marginBottom:'12px' }}>{searchTerm ? 'No books found' : 'Library catalogue is empty'}</div>
            {!searchTerm && <button onClick={() => setShowAddBook(true)} style={{ padding:'8px 20px', background:'#0C447C', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer' }}>+ Add First Book</button>}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
            {filtered.map((b:any) => (
              <div key={b._id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'14px', borderLeft:`4px solid ${catColors[b.category]||'#888'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ padding:'2px 8px', background:(catColors[b.category]||'#888')+'22', color:catColors[b.category]||'#888', borderRadius:'99px', fontSize:'10px', textTransform:'capitalize' as const }}>{b.category?.replace('_',' ')}</span>
                  <span style={{ padding:'2px 8px', background:b.availableCopies>0?'#e6f7ed':'#fdecea', color:b.availableCopies>0?'#1D9E75':'#E24B4A', borderRadius:'99px', fontSize:'10px' }}>{b.availableCopies>0?`${b.availableCopies} available`:'All issued'}</span>
                </div>
                <div style={{ fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>{b.title}</div>
                <div style={{ fontSize:'12px', color:'#666', marginBottom:'2px' }}>{b.author}</div>
                <div style={{ fontSize:'11px', color:'#aaa', marginBottom:'8px' }}>{b.publisher}{b.publishYear?` • ${b.publishYear}`:''}</div>
                <div style={{ fontSize:'11px', color:'#888', marginBottom:'8px' }}>Acc: {b.accessionNo} | {b.totalCopies} copies</div>
                <div style={{ height:'4px', background:'#f0f0f0', borderRadius:'2px', marginBottom:'10px' }}>
                  <div style={{ width:`${b.totalCopies>0?Math.round((b.availableCopies/b.totalCopies)*100):0}%`, height:'100%', background:b.availableCopies>0?'#1D9E75':'#E24B4A', borderRadius:'2px' }} />
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={() => setIssuingBook(b)} disabled={b.availableCopies<1}
                    style={{ flex:1, padding:'6px', background:b.availableCopies>0?'#0C447C':'#f5f5f5', color:b.availableCopies>0?'#fff':'#aaa', border:'none', borderRadius:'4px', cursor:b.availableCopies>0?'pointer':'not-allowed', fontSize:'11px' }}>
                    📤 Issue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {subTab==='issues' && (
        (issues as any[]).length===0 ? (
          <div style={{ padding:'60px', textAlign:'center' as const, color:'#888', background:'#f9f9f9', borderRadius:'8px' }}>
            <div style={{ fontSize:'40px', marginBottom:'8px' }}>📤</div>
            <div style={{ fontWeight:500 }}>No issue records yet</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead><tr style={{ background:'#f8f9fa' }}>
              {['Book','Borrower','Class','Issued','Due Date','Status','Actions'].map(h => (
                <th key={h} style={{ padding:'10px', textAlign:'left' as const, fontWeight:500, color:'#666', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{(issues as any[]).map((iss:any) => {
              const now2=new Date(); const due2=new Date(iss.dueDate);
              const diff=Math.ceil((due2.getTime()-now2.getTime())/(1000*60*60*24));
              const isOD=diff<0&&iss.status==='issued';
              const sc:any={issued:'#378ADD',returned:'#1D9E75',overdue:'#E24B4A'};
              return (
                <tr key={iss._id} style={{ borderBottom:'1px solid #f0f0f0', background:isOD?'#fff8f8':'transparent' }}>
                  <td style={{ padding:'10px', fontWeight:500 }}>{iss.bookTitle}</td>
                  <td style={{ padding:'10px' }}>{iss.borrowerName}</td>
                  <td style={{ padding:'10px', fontSize:'12px', color:'#888' }}>{iss.borrowerClass||'—'}</td>
                  <td style={{ padding:'10px', fontSize:'12px', color:'#888' }}>{iss.issueDate?new Date(iss.issueDate).toLocaleDateString():'—'}</td>
                  <td style={{ padding:'10px', fontSize:'12px' }}>{iss.dueDate?new Date(iss.dueDate).toLocaleDateString():'—'}</td>
                  <td style={{ padding:'10px' }}><span style={{ padding:'2px 8px', borderRadius:'99px', fontSize:'11px', background:(sc[isOD?'overdue':iss.status]||'#888')+'22', color:sc[isOD?'overdue':iss.status]||'#888' }}>{isOD?'overdue':iss.status}</span></td>
                  <td style={{ padding:'10px' }}>
                    {(iss.status==='issued'||iss.status==='overdue') && <button onClick={() => setReturningIssue(iss)} style={{ padding:'4px 10px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>Return</button>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        )
      )}

      {subTab==='overdue' && (
        (overdue as any[]).length===0 ? (
          <div style={{ padding:'60px', textAlign:'center' as const, color:'#888', background:'#f9f9f9', borderRadius:'8px' }}>
            <div style={{ fontSize:'40px', marginBottom:'8px' }}>✅</div>
            <div style={{ fontWeight:500 }}>No overdue books!</div>
          </div>
        ) : (
          <div>
            <div style={{ background:'#fdecea', border:'1px solid #E24B4A33', borderRadius:'8px', padding:'12px', marginBottom:'14px' }}>
              <span style={{ fontWeight:600, color:'#E24B4A' }}>⚠ {(overdue as any[]).length} overdue books</span>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead><tr style={{ background:'#f8f9fa' }}>{['Book','Borrower','Due Date','Days Overdue','Fine (PKR)','Actions'].map(h => <th key={h} style={{ padding:'10px', textAlign:'left' as const, fontWeight:500, color:'#666', borderBottom:'1px solid #e5e7eb' }}>{h}</th>)}</tr></thead>
              <tbody>{(overdue as any[]).map((o:any) => {
                const d=Math.ceil((new Date().getTime()-new Date(o.dueDate).getTime())/(1000*60*60*24));
                return (
                  <tr key={o._id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <td style={{ padding:'10px', fontWeight:500 }}>{o.bookTitle}</td>
                    <td style={{ padding:'10px' }}>{o.borrowerName}</td>
                    <td style={{ padding:'10px', color:'#E24B4A', fontSize:'12px' }}>{new Date(o.dueDate).toLocaleDateString()}</td>
                    <td style={{ padding:'10px', color:'#E24B4A', fontWeight:600 }}>{d} days</td>
                    <td style={{ padding:'10px', fontWeight:600, color:'#E24B4A' }}>PKR {d*5}</td>
                    <td style={{ padding:'10px' }}><button onClick={() => setReturningIssue(o)} style={{ padding:'4px 10px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px' }}>Return Now</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )
      )}

      {subTab==='reports' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'16px' }}>
            <div style={{ borderLeft:'3px solid #EF9F27', paddingLeft:'10px', fontWeight:600, color:'#0C447C', marginBottom:'14px' }}>Collection by Category</div>
            {BOOK_CATEGORIES.map(cat => {
              const count=(books as any[]).filter((b:any)=>b.category===cat).length;
              if(!count) return null;
              return <div key={cat} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <span style={{ fontSize:'12px', textTransform:'capitalize' as const, color:'#555' }}>{cat.replace('_',' ')}</span>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'80px', height:'6px', background:'#f0f0f0', borderRadius:'3px' }}><div style={{ width:`${(books as any[]).length>0?Math.round((count/(books as any[]).length)*100):0}%`, height:'100%', background:catColors[cat]||'#888', borderRadius:'3px' }} /></div>
                  <span style={{ fontSize:'12px', fontWeight:600 }}>{count}</span>
                </div>
              </div>;
            })}
          </div>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'16px' }}>
            <div style={{ borderLeft:'3px solid #EF9F27', paddingLeft:'10px', fontWeight:600, color:'#0C447C', marginBottom:'14px' }}>Issue Statistics</div>
            {[{l:'Total Books',v:libStats?.total??0},{l:'Available',v:libStats?.available??0},{l:'Currently Issued',v:libStats?.issued??0},{l:'Overdue',v:libStats?.overdue??0},{l:'Total Issues All Time',v:libStats?.totalIssues??0}].map(s => (
              <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f5' }}>
                <span style={{ fontSize:'13px', color:'#555' }}>{s.l}</span>
                <span style={{ fontWeight:600, color:'#0C447C' }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AcademicsPage() {
  const location = useLocation();
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('curriculum')) return 'curriculum';
    if (path.includes('syllabus')) return 'syllabus';
    if (path.includes('timetable')) return 'timetable';
    if (path.includes('library')) return 'library';
    return 'dashboard';
  };
  const [activeTab, setActiveTab] = useState(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':  return <AcademicsDashboardTab />;
      case 'curriculum': return <CurriculumTab />;
      case 'syllabus':   return <SyllabusManagerTab />;
      case 'timetable':  return <TimetableIntelligenceTab />;
      case 'library':    return <LibraryTab />;
      default:           return <AcademicsDashboardTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa' }}>
      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 20px', display: 'flex', overflowX: 'auto' as const }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '12px 20px', background: 'none', border: 'none', color: activeTab === tab.id ? '#0C447C' : '#888', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400, borderBottom: activeTab === tab.id ? '2px solid #EF9F27' : '2px solid transparent', whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderTab()}
      </div>
    </div>
  );
}
