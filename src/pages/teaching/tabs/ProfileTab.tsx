import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';

const CERT_OPTIONS = [
  'Cambridge Certified', 'IB Certified', 'Google Educator', 'Microsoft Educator',
  'SEN Trained', 'Early Childhood', 'IELTS Examiner', 'Subject Specialist',
];

// ─── SPINNER ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── PBAR ─────────────────────────────────────────────────────────────────────

function PBar({ pct, color = '#0C447C' }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s' }} />
    </div>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────

export function TeachingProfileTab() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachingService.getTeachers,
  });

  const { data: lessonPlans = [] } = useQuery({
    queryKey: ['lesson-plans'],
    queryFn: teachingService.getLessonPlans,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: teachingService.getAssignments,
  });

  const qc = useQueryClient();
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teachingService.updateTeacher(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Profile updated');
      setEditMode(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  const teacherList = teachers as any[];
  const teacher: any = teacherList.find((t: any) => t._id === selectedTeacherId) || teacherList[0];

  React.useEffect(() => {
    if (teacher && !selectedTeacherId) setSelectedTeacherId(teacher._id);
  }, [teacher?._id]);

  React.useEffect(() => {
    if (teacher) setEditForm({ ...teacher });
  }, [teacher?._id]);

  const teacherPlans = (lessonPlans as any[]).filter(
    (p: any) => p.teacherId === teacher?._id || p.teacherName === `${teacher?.firstName} ${teacher?.lastName}`,
  );
  const teacherAssignments = (assignments as any[]).filter(
    (a: any) => a.teacherName === `${teacher?.firstName} ${teacher?.lastName}`,
  );
  const approvedPlans = teacherPlans.filter((p: any) => p.status === 'approved').length;
  const workloadPct = teacher
    ? Math.round(((teacher.currentPeriodsPerWeek || 0) / (teacher.maxPeriodsPerWeek || 30)) * 100)
    : 0;

  const labelSt: React.CSSProperties = {
    fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2,
  };
  const valueSt: React.CSSProperties = { fontSize: 14, color: '#1a1a1a', fontWeight: 500 };

  // ─── LOADING ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Spin /> Loading teacher profiles…
      </div>
    );
  }

  // ─── EMPTY ──────────────────────────────────────────────────────────────────

  if (teacherList.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: 8, margin: 16 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👨‍🏫</div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>No teacher profiles yet</div>
        <div style={{ fontSize: 12 }}>Go to the Teachers tab to create profiles</div>
      </div>
    );
  }

  // ─── MAIN LAYOUT ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, minHeight: 600 }}>

      {/* ── Left sidebar — teacher list ────────────────────────────────────── */}
      <div style={{ width: 220, borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {teacherList.length} Teacher{teacherList.length !== 1 ? 's' : ''}
        </div>
        {teacherList.map((t: any) => {
          const initials = `${t.firstName?.[0] || ''}${t.lastName?.[0] || ''}`.toUpperCase();
          const isSelected = t._id === (selectedTeacherId || teacher?._id);
          return (
            <div
              key={t._id}
              onClick={() => { setSelectedTeacherId(t._id); setEditMode(false); }}
              style={{
                padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                background: isSelected ? '#EBF2FA' : 'transparent',
                borderLeft: isSelected ? '3px solid #0C447C' : '3px solid transparent',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0C447C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#0C447C' : '#333' }}>
                  {t.firstName} {t.lastName}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>{t.designation || 'Teacher'}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right panel — teacher detail ───────────────────────────────────── */}
      {teacher && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* Profile header */}
          <div style={{ background: 'linear-gradient(135deg, #0C447C 0%, #1565A8 100%)', borderRadius: 12, padding: 24, marginBottom: 20, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, border: '2px solid rgba(255,255,255,0.4)' }}>
                {`${teacher.firstName?.[0] || ''}${teacher.lastName?.[0] || ''}`.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{teacher.firstName} {teacher.lastName}</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{teacher.designation || 'Teacher'} · {teacher.department || 'Academic'}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {(teacher.subjectsCanTeach || []).slice(0, 4).map((s: string) => (
                    <span key={s} style={{ padding: '2px 8px', background: 'rgba(239,159,39,0.3)', border: '1px solid rgba(239,159,39,0.5)', borderRadius: 99, fontSize: 11, color: '#EF9F27' }}>{s}</span>
                  ))}
                  {(teacher.subjectsCanTeach || []).length > 4 && (
                    <span style={{ fontSize: 11, opacity: 0.7 }}>+{teacher.subjectsCanTeach.length - 4} more</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '4px 12px', background: teacher.status === 'active' ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.15)', border: `1px solid ${teacher.status === 'active' ? '#1D9E75' : 'rgba(255,255,255,0.3)'}`, borderRadius: 99, fontSize: 12, color: teacher.status === 'active' ? '#4ade80' : '#fff' }}>
                {teacher.status || 'active'}
              </span>
              <button
                onClick={() => setEditMode(!editMode)}
                style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, fontSize: 12, color: '#fff', cursor: 'pointer' }}
              >
                {editMode ? 'Cancel Edit' : '✏ Edit Profile'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Periods/Week', value: `${teacher.currentPeriodsPerWeek || 0}/${teacher.maxPeriodsPerWeek || 30}`, color: workloadPct > 90 ? '#E24B4A' : workloadPct > 70 ? '#BA7517' : '#1D9E75' },
              { label: 'Lesson Plans', value: teacherPlans.length, color: '#0C447C' },
              { label: 'Approved Plans', value: approvedPlans, color: '#1D9E75' },
              { label: 'Assignments', value: teacherAssignments.length, color: '#7F77DD' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Workload bar */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Weekly Workload</span>
              <span style={{ fontSize: 13, color: workloadPct > 90 ? '#E24B4A' : '#666' }}>{workloadPct}% of max capacity</span>
            </div>
            <PBar pct={workloadPct} color={workloadPct > 90 ? '#E24B4A' : workloadPct > 70 ? '#EF9F27' : '#1D9E75'} />
            {workloadPct > 90 && (
              <div style={{ fontSize: 12, color: '#E24B4A', marginTop: 6 }}>⚠ Overloaded — consider redistributing periods</div>
            )}
          </div>

          {/* ── Edit form ──────────────────────────────────────────────────── */}
          {editMode ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0C447C', marginBottom: 16 }}>Edit Teacher Profile</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Max Periods/Day', key: 'maxPeriodsPerDay', type: 'number' },
                  { label: 'Max Periods/Week', key: 'maxPeriodsPerWeek', type: 'number' },
                  { label: 'Class Teacher Of', key: 'classTeacherOfName', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={editForm[f.key] || ''}
                      onChange={e => setEditForm((prev: any) => ({
                        ...prev,
                        [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value,
                      }))}
                      style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8 }}>Certifications</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {CERT_OPTIONS.map(c => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(editForm.certifications || []).includes(c)}
                        onChange={e => setEditForm((prev: any) => ({
                          ...prev,
                          certifications: e.target.checked
                            ? [...(prev.certifications || []), c]
                            : (prev.certifications || []).filter((x: string) => x !== c),
                        }))}
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditMode(false)}
                  style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMut.mutate({ id: teacher._id, data: editForm })}
                  disabled={updateMut.isPending}
                  style={{ padding: '8px 16px', background: '#0C447C', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, opacity: updateMut.isPending ? 0.7 : 1 }}
                >
                  {updateMut.isPending && <Spin />}
                  {updateMut.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

          ) : (
            /* ── View mode ─────────────────────────────────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Teaching Assignment */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: 12, marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#0C447C' }}>Teaching Assignment</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={labelSt}>Subjects</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {(teacher.subjectsCanTeach || []).length === 0 && <span style={{ fontSize: 12, color: '#aaa' }}>—</span>}
                      {(teacher.subjectsCanTeach || []).map((s: string) => (
                        <span key={s} style={{ padding: '2px 8px', background: '#FFF3DC', color: '#BA7517', borderRadius: 99, fontSize: 11 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={labelSt}>Grade Levels</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {(teacher.gradeLevelsCanTeach || []).length === 0 && <span style={{ fontSize: 12, color: '#aaa' }}>—</span>}
                      {(teacher.gradeLevelsCanTeach || []).map((g: string) => (
                        <span key={g} style={{ padding: '2px 8px', background: '#EBF2FA', color: '#0C447C', borderRadius: 99, fontSize: 11 }}>{g}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={labelSt}>Class Teacher Of</div>
                    <div style={valueSt}>{teacher.classTeacherOfName || '—'}</div>
                  </div>
                  <div>
                    <div style={labelSt}>Max Periods/Day</div>
                    <div style={valueSt}>{teacher.maxPeriodsPerDay || 6}</div>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: 12, marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#0C447C' }}>Certifications & Skills</div>
                {(teacher.certifications || []).length === 0
                  ? <div style={{ fontSize: 12, color: '#aaa' }}>No certifications recorded — click Edit to add</div>
                  : (teacher.certifications || []).map((c: string) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#1D9E75' }}>✓</span>{c}
                    </div>
                  ))}
                {teacher.overallRating > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
                    <div style={labelSt}>Overall Rating</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: '#EF9F27' }}>⭐ {teacher.overallRating?.toFixed(1)}</div>
                  </div>
                )}
              </div>

              {/* Recent Lesson Plans */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: 12, marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#0C447C' }}>Recent Lesson Plans</div>
                {teacherPlans.length === 0
                  ? <div style={{ fontSize: 12, color: '#aaa' }}>No lesson plans yet</div>
                  : teacherPlans.slice(0, 5).map((p: any) => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{p.topic}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{p.subject} · {p.gradeLevel}</div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: 99, fontSize: 10,
                        background: p.status === 'approved' ? '#e6f7ed' : p.status === 'submitted' ? '#e8f0fe' : '#f5f5f5',
                        color: p.status === 'approved' ? '#1D9E75' : p.status === 'submitted' ? '#378ADD' : '#888',
                      }}>
                        {p.status}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Recent Assignments */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: 12, marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#0C447C' }}>Recent Assignments</div>
                {teacherAssignments.length === 0
                  ? <div style={{ fontSize: 12, color: '#aaa' }}>No assignments yet</div>
                  : teacherAssignments.slice(0, 5).map((a: any) => (
                    <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{a.subject} · Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}</div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, background: '#f5f5f5', color: '#888' }}>{a.type}</span>
                    </div>
                  ))}
              </div>

              {/* Performance (teacher attendance now lives in HR → Staff Attendance) */}
              {(teacher.lessonPlanCompliancePct > 0 || teacher.avgStudentPerformance > 0) && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, gridColumn: '1 / -1' }}>
                  <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: 12, marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#0C447C' }}>Performance Metrics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                    {[
                      { label: 'LP Compliance', pct: teacher.lessonPlanCompliancePct || 0, color: '#0C447C' },
                      { label: 'Avg Student Perf.', pct: teacher.avgStudentPerformance || 0, color: '#EF9F27' },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#555' }}>{m.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.pct}%</span>
                        </div>
                        <PBar pct={m.pct} color={m.color} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
