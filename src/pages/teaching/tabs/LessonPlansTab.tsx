import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import teachingService from '../../../services/teaching.service';
import {
  ModalShell, FormSection, TeacherDropdown, SubjectDropdown,
  GradeLevelDropdown, SectionDropdown, CampusDropdown, VisualCardSelector, RESOURCES_LIST,
  inputCls, labelCls,
} from './shared';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const METHODOLOGIES = [
  { id: 'lecture',    icon: '📖', label: 'Lecture' },
  { id: 'discussion', icon: '💬', label: 'Discussion' },
  { id: 'activity',   icon: '🔬', label: 'Activity / Lab' },
  { id: 'demo',       icon: '🎬', label: 'Demo' },
  { id: 'project',    icon: '📊', label: 'Project' },
  { id: 'flipped',    icon: '🔄', label: 'Flipped' },
];

const STATUS_STYLE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  overdue:   'bg-red-50 text-red-700 border-red-200',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LPForm {
  teacherName: string;
  teacherId: string;
  campusId: string;
  subject: string;
  gradeLevel: string;
  sectionName: string;
  topic: string;
  description: string;
  planDate: string;
  durationMins: number;
  teachingMethodology: string;
  objectives: string[];
  resources: string[];
  otherResource: string;
  homework: string;
  status: string;
}

const EMPTY: LPForm = {
  teacherName: '', teacherId: '', campusId: '', subject: '', gradeLevel: '', sectionName: '',
  topic: '', description: '', planDate: '', durationMins: 40,
  teachingMethodology: 'lecture', objectives: [''], resources: [],
  otherResource: '', homework: '', status: 'draft',
};

// ─── SPINNER ──────────────────────────────────────────────────────────────────

function Spin() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── VIEW LESSON PLAN MODAL ───────────────────────────────────────────────────

function ViewLessonPlanModal({ plan, onClose }: { plan: any; onClose: () => void }) {
  const method = METHODOLOGIES.find(m => m.id === plan.teachingMethodology);
  const statusStyle = STATUS_STYLE[plan.status] ?? STATUS_STYLE.draft;
  const objectives: string[] = plan.learningObjectives ?? plan.objectives ?? [];
  const resources: string[] = plan.resources ?? [];

  return (
    <ModalShell
      title="Lesson Plan"
      sub={plan.topic}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="p-6 space-y-5">

        {/* Header meta row */}
        <div className="flex flex-wrap gap-2 items-center">
          {plan.subject && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
              {plan.subject}
            </span>
          )}
          {plan.gradeLevel && (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
              {plan.gradeLevel}{plan.sectionName ? ` — ${plan.sectionName}` : ''}
            </span>
          )}
          {plan.planDate && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold">
              📅 {new Date(plan.planDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          {plan.durationMins && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold">
              ⏱ {plan.durationMins} mins
            </span>
          )}
          <span className={`ml-auto inline-flex items-center px-2.5 py-1 border rounded-full text-xs font-semibold ${statusStyle}`}>
            {plan.status === 'submitted' ? 'Pending Approval' : plan.status}
          </span>
        </div>

        {/* Topic */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Topic</div>
          <div className="text-lg font-bold text-slate-900">{plan.topic}</div>
          {plan.description && <div className="text-sm text-slate-500 mt-1">{plan.description}</div>}
        </div>

        {/* Teacher */}
        {plan.teacherName && (
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Teacher</div>
            <div className="text-sm font-medium text-slate-700">{plan.teacherName}</div>
          </div>
        )}

        {/* Learning Objectives */}
        {objectives.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Learning Objectives</div>
            <ol className="space-y-1.5">
              {objectives.map((obj, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#0C447C] text-white text-xs flex items-center justify-center font-semibold mt-0.5">{i + 1}</span>
                  {obj}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Teaching Methodology */}
        {plan.teachingMethodology && (
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Teaching Methodology</div>
            <div className="text-sm text-slate-700">
              {method ? `${method.icon} ${method.label}` : plan.teachingMethodology}
            </div>
          </div>
        )}

        {/* Resources */}
        {resources.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Resources</div>
            <div className="flex flex-wrap gap-1.5">
              {resources.map(r => (
                <span key={r} className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Homework */}
        {plan.homework && (
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Homework</div>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">{plan.homework}</div>
          </div>
        )}

        {/* Approver notes / rejection reason */}
        {(plan.approverNotes || plan.rejectionReason) && (
          <div className={`rounded-lg p-4 border ${plan.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${plan.status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
              {plan.status === 'approved' ? 'Approver Notes' : 'Rejection Reason'}
            </div>
            <div className={`text-sm ${plan.status === 'approved' ? 'text-emerald-800' : 'text-red-800'}`}>
              {plan.approverNotes || plan.rejectionReason}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── SHARED LESSON PLAN FORM BODY ─────────────────────────────────────────────
// Extracted so both Create and Edit can render identical form fields.

function LPFormBody({
  form,
  setForm,
  selectedTeacher,
  onTeacherSelect,
  readonlyTeacher = false,
}: {
  form: LPForm;
  setForm: React.Dispatch<React.SetStateAction<LPForm>>;
  selectedTeacher: any;
  onTeacherSelect: (t: any) => void;
  readonlyTeacher?: boolean;
}) {
  const teacherSubjects: string[] = selectedTeacher?.subjectsCanTeach ?? [];

  function toggleResource(r: string) {
    setForm(p => ({
      ...p,
      resources: p.resources.includes(r)
        ? p.resources.filter(x => x !== r)
        : [...p.resources, r],
    }));
  }

  function addObjective() {
    setForm(p => ({ ...p, objectives: [...p.objectives, ''] }));
  }

  function updateObjective(i: number, val: string) {
    setForm(p => {
      const next = [...p.objectives];
      next[i] = val;
      return { ...p, objectives: next };
    });
  }

  function removeObjective(i: number) {
    setForm(p => ({ ...p, objectives: p.objectives.filter((_, idx) => idx !== i) }));
  }

  return (
    <>
      {/* Section 1: Teacher & Class */}
      <FormSection title="Teacher & Class">
        {readonlyTeacher ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-[#0C447C]">
            {form.teacherName || 'No teacher assigned'}
          </div>
        ) : (
          <TeacherDropdown value={selectedTeacher} onSelect={onTeacherSelect} />
        )}
        <div className="grid grid-cols-4 gap-3 mt-3">
          <CampusDropdown
            value={form.campusId}
            onChange={v => setForm(p => ({ ...p, campusId: v, gradeLevel: '', sectionName: '' }))}
          />
          <SubjectDropdown
            subjects={teacherSubjects}
            value={form.subject}
            onChange={v => setForm(p => ({ ...p, subject: v }))}
          />
          <GradeLevelDropdown
            campusId={form.campusId}
            value={form.gradeLevel}
            onChange={v => setForm(p => ({ ...p, gradeLevel: v, sectionName: '' }))}
          />
          <SectionDropdown
            campusId={form.campusId}
            gradeLevel={form.gradeLevel}
            value={form.sectionName}
            onChange={v => setForm(p => ({ ...p, sectionName: v }))}
          />
        </div>
      </FormSection>

      {/* Section 2: Plan Details */}
      <FormSection title="Plan Details">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-2">
            <label className={labelCls}>Topic *</label>
            <input
              value={form.topic}
              onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
              placeholder="e.g. Quadratic Equations – Introduction"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Plan Date *</label>
            <input
              type="date"
              value={form.planDate}
              onChange={e => setForm(p => ({ ...p, planDate: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <label className={labelCls}>Duration (mins)</label>
            <input
              type="number" min={10} max={180}
              value={form.durationMins}
              onChange={e => setForm(p => ({ ...p, durationMins: parseInt(e.target.value) || 40 }))}
              className={inputCls}
            />
          </div>
          <div className="col-span-3">
            <label className={labelCls}>Description</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief summary of the lesson…"
              className={inputCls}
            />
          </div>
        </div>
      </FormSection>

      {/* Section 3: Learning Objectives */}
      <FormSection title="Learning Objectives">
        <div className="space-y-2 mb-2">
          {form.objectives.map((obj, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 w-5 shrink-0 text-right">{i + 1}.</span>
              <input
                value={obj}
                onChange={e => updateObjective(i, e.target.value)}
                placeholder="Students will be able to…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C]"
              />
              {form.objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(i)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addObjective}
          className="text-xs font-medium text-[#0C447C] hover:text-[#0b3d6e] flex items-center gap-1 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Add Objective
        </button>
      </FormSection>

      {/* Section 4: Teaching Methodology */}
      <FormSection title="Teaching Methodology">
        <VisualCardSelector
          options={METHODOLOGIES}
          value={form.teachingMethodology}
          onChange={v => setForm(p => ({ ...p, teachingMethodology: v }))}
          cols={6}
        />
      </FormSection>

      {/* Section 5: Resources */}
      <FormSection title="Resources">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {RESOURCES_LIST.map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.resources.includes(r)}
                onChange={() => toggleResource(r)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#0C447C] focus:ring-[#0C447C] focus:ring-offset-0"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">{r}</span>
            </label>
          ))}
        </div>
        <div>
          <label className={labelCls}>Other Resource</label>
          <input
            value={form.otherResource}
            onChange={e => setForm(p => ({ ...p, otherResource: e.target.value }))}
            placeholder="Specify any other resource…"
            className={inputCls}
          />
        </div>
      </FormSection>

      {/* Section 6: Homework */}
      <FormSection title="Homework">
        <textarea
          value={form.homework}
          onChange={e => setForm(p => ({ ...p, homework: e.target.value }))}
          rows={2}
          placeholder="Homework to be assigned after this lesson…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] resize-y"
        />
      </FormSection>
    </>
  );
}

// ─── CREATE LESSON PLAN MODAL ─────────────────────────────────────────────────

function CreateLessonPlanModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<LPForm>(EMPTY);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const mut = useMutation({
    mutationFn: (payload: any) => teachingService.createLessonPlan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Lesson plan created');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm(p => ({
      ...p,
      teacherId: t._id,
      teacherName: `${t.firstName} ${t.lastName}`,
      subject: '',
    }));
  }

  function handleSubmit(status: 'draft' | 'submitted') {
    const allResources = form.otherResource.trim()
      ? [...form.resources, form.otherResource.trim()]
      : form.resources;
    const cleanObjectives = form.objectives.filter(o => o.trim());
    const { otherResource, ...rest } = form;
    mut.mutate({ ...rest, status, resources: allResources, objectives: cleanObjectives });
  }

  const canSubmit = form.teacherName && form.subject && form.gradeLevel && form.topic && form.planDate && !mut.isPending;

  return (
    <ModalShell
      title="Create Lesson Plan"
      sub="Fill in the details and submit for approval or save as draft"
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="p-6">
        <LPFormBody
          form={form}
          setForm={setForm}
          selectedTeacher={selectedTeacher}
          onTeacherSelect={handleTeacherSelect}
        />
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={!form.teacherName || !form.topic || mut.isPending}
            className="px-4 py-2 text-sm font-medium text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('submitted')}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {mut.isPending && <Spin />}
            Submit for Approval
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── EDIT LESSON PLAN MODAL ───────────────────────────────────────────────────

function EditLessonPlanModal({
  plan,
  onClose,
  resubmit = false,
}: {
  plan: any;
  onClose: () => void;
  resubmit?: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<LPForm>(EMPTY);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  useEffect(() => {
    setForm({
      teacherName: plan.teacherName || '',
      teacherId: plan.teacherId || '',
      campusId: plan.campusId || '',
      subject: plan.subject || '',
      gradeLevel: plan.gradeLevel || '',
      sectionName: plan.sectionName || '',
      topic: plan.topic || '',
      description: plan.description || '',
      planDate: plan.planDate ? new Date(plan.planDate).toISOString().split('T')[0] : '',
      durationMins: plan.durationMins || 40,
      teachingMethodology: plan.teachingMethodology || 'lecture',
      objectives: (plan.learningObjectives ?? plan.objectives ?? []).length > 0
        ? (plan.learningObjectives ?? plan.objectives ?? [])
        : [''],
      resources: plan.resources || [],
      otherResource: '',
      homework: plan.homework || '',
      status: plan.status || 'draft',
    });
  }, [plan._id]);

  const mut = useMutation({
    mutationFn: (payload: any) => teachingService.updateLessonPlan(plan._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success(resubmit ? 'Plan updated and submitted for approval' : 'Plan updated');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update'),
  });

  function handleTeacherSelect(t: any) {
    setSelectedTeacher(t);
    setForm(p => ({
      ...p,
      teacherId: t._id,
      teacherName: `${t.firstName} ${t.lastName}`,
      subject: '',
    }));
  }

  function handleSave(forcedStatus?: string) {
    const allResources = form.otherResource.trim()
      ? [...form.resources, form.otherResource.trim()]
      : form.resources;
    const cleanObjectives = form.objectives.filter(o => o.trim());
    const { otherResource, ...rest } = form;
    mut.mutate({
      ...rest,
      status: forcedStatus ?? (resubmit ? 'submitted' : form.status),
      resources: allResources,
      objectives: cleanObjectives,
    });
  }

  const canSave = form.topic && !mut.isPending;
  const modalTitle = resubmit ? 'Edit & Resubmit Plan' : 'Edit Lesson Plan';
  const modalSub = resubmit
    ? 'Update the plan and it will be resubmitted for approval'
    : 'Update lesson plan details';

  return (
    <ModalShell title={modalTitle} sub={modalSub} onClose={onClose} maxWidth="max-w-3xl">
      <div className="p-6">
        <LPFormBody
          form={form}
          setForm={setForm}
          selectedTeacher={selectedTeacher}
          onTeacherSelect={handleTeacherSelect}
          readonlyTeacher={!selectedTeacher && !!form.teacherName}
        />
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} type="button"
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          {!resubmit && (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={!canSave}
              className="px-4 py-2 text-sm font-medium text-[#0C447C] border border-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
            >
              Save as Draft
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave(resubmit ? 'submitted' : undefined)}
            disabled={!canSave}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2 ${
              resubmit ? 'bg-[#EF9F27] hover:bg-amber-600' : 'bg-[#0C447C] hover:bg-[#0b3d6e]'
            }`}
          >
            {mut.isPending && <Spin />}
            {resubmit ? 'Save & Resubmit' : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── APPROVE / REJECT MODAL ───────────────────────────────────────────────────
// Captures a real approver note or rejection reason instead of sending an
// empty string / a hardcoded placeholder. The lesson plan detail view already
// displays plan.approverNotes / plan.rejectionReason — this is what actually
// populates them with something a teacher can read and act on.

function ApproveRejectModal({
  plan,
  action,
  onClose,
  onSubmit,
  isPending,
}: {
  plan: any;
  action: 'approve' | 'reject';
  onClose: () => void;
  onSubmit: (text: string) => void;
  isPending: boolean;
}) {
  const [text, setText] = useState('');
  const isReject = action === 'reject';
  const canSubmit = !isReject || text.trim().length > 0;

  return (
    <ModalShell
      title={isReject ? 'Reject Lesson Plan' : 'Approve Lesson Plan'}
      sub={`${plan.topic || 'Lesson plan'} · ${plan.subject || ''}`}
      onClose={onClose}
    >
      <div className="p-6 space-y-4">
        <div>
          <label className={labelCls}>
            {isReject ? 'Rejection reason (required)' : 'Approver notes (optional)'}
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder={isReject
              ? 'Explain what needs to change before this plan can be approved…'
              : 'Any feedback for the teacher (optional)…'}
            className={inputCls}
            autoFocus
          />
          {isReject && !canSubmit && (
            <div className="text-xs text-red-500 mt-1">A reason is required so the teacher knows what to fix.</div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(text.trim())}
            disabled={!canSubmit || isPending}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2 ${
              isReject ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isPending && <Spin />}
            {isReject ? 'Reject Plan' : 'Approve Plan'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── LESSON PLANS TAB ─────────────────────────────────────────────────────────

export function TeachingLessonPlansTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [editPlan, setEditPlan] = useState<any>(null);
  const [resubmitPlan, setResubmitPlan] = useState<any>(null);
  const [viewPlan, setViewPlan] = useState<any>(null);
  const [actionPlan, setActionPlan] = useState<{ plan: any; action: 'approve' | 'reject' } | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['lesson-plans', filter],
    queryFn: () => teachingService.getLessonPlans(filter ? { status: filter } : {}),
  });

  const approve = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => teachingService.approveLessonPlan(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plan approved');
      setActionPlan(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => teachingService.rejectLessonPlan(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plan rejected');
      setActionPlan(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const submitPlan = useMutation({
    mutationFn: (id: string) => teachingService.updateLessonPlan(id, { status: 'submitted' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-plans'] });
      toast.success('Plan submitted for approval');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const planList = plans as any[];
  const pending = planList.filter(p => p.status === 'submitted').length;

  return (
    <div>
      {showCreate    && <CreateLessonPlanModal onClose={() => setShowCreate(false)} />}
      {editPlan      && <EditLessonPlanModal plan={editPlan} onClose={() => setEditPlan(null)} />}
      {resubmitPlan  && <EditLessonPlanModal plan={resubmitPlan} resubmit onClose={() => setResubmitPlan(null)} />}
      {viewPlan      && <ViewLessonPlanModal plan={viewPlan} onClose={() => setViewPlan(null)} />}
      {actionPlan    && (
        <ApproveRejectModal
          plan={actionPlan.plan}
          action={actionPlan.action}
          onClose={() => setActionPlan(null)}
          isPending={actionPlan.action === 'approve' ? approve.isPending : reject.isPending}
          onSubmit={(text) => {
            if (actionPlan.action === 'approve') approve.mutate({ id: actionPlan.plan._id, notes: text });
            else reject.mutate({ id: actionPlan.plan._id, reason: text });
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lesson Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {planList.length} plan{planList.length !== 1 ? 's' : ''}
            {pending > 0 ? ` · ${pending} pending approval` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
          Create Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-5">
        {[
          { value: '', label: 'All' },
          { value: 'submitted', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'draft', label: 'Draft' },
          { value: 'overdue', label: 'Overdue' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              filter === f.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
            {f.value === 'submitted' && pending > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#EF9F27] text-white text-xs rounded-full font-bold">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading lesson plans…
        </div>
      ) : planList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <div className="font-semibold text-slate-700 text-lg mb-1">No lesson plans yet</div>
          <div className="text-sm text-slate-400 mb-5">Create your first lesson plan and submit for approval</div>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0C447C] text-white text-sm font-medium rounded-lg hover:bg-[#0b3d6e] transition-colors">
            Create Lesson Plan
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Teacher', 'Subject', 'Grade', 'Topic', 'Date', 'Methodology', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap bg-slate-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planList.map((p: any) => {
                  const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft;
                  const method = METHODOLOGIES.find(m => m.id === p.teachingMethodology);
                  return (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800">{p.teacherName || '—'}</td>
                      <td className="py-3 px-4">
                        {p.subject && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                            {p.subject}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.gradeLevel || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 max-w-[160px] truncate">{p.topic}</div>
                        {p.description && <div className="text-xs text-slate-400 max-w-[160px] truncate">{p.description}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {p.planDate ? new Date(p.planDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {method ? `${method.icon} ${method.label}` : p.teachingMethodology || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-xs font-medium capitalize ${s}`}>
                          {p.status === 'submitted' ? 'Pending' : p.status}
                        </span>
                      </td>

                      {/* ── Actions column ──────────────────────────────────── */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">

                          {/* View — all statuses */}
                          <button
                            onClick={() => setViewPlan(p)}
                            className="px-2.5 py-1 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            View
                          </button>

                          {/* draft */}
                          {p.status === 'draft' && (
                            <>
                              <button
                                onClick={() => setEditPlan(p)}
                                className="px-2.5 py-1 text-xs border border-[#0C447C] text-[#0C447C] rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => submitPlan.mutate(p._id)}
                                disabled={submitPlan.isPending}
                                className="px-2.5 py-1 text-xs bg-[#0C447C] text-white rounded-lg hover:bg-[#0b3d6e] transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {submitPlan.isPending && <Spin />}
                                Submit
                              </button>
                            </>
                          )}

                          {/* submitted / pending */}
                          {p.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => setActionPlan({ plan: p, action: 'approve' })}
                                className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setActionPlan({ plan: p, action: 'reject' })}
                                className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* approved */}
                          {p.status === 'approved' && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                              Approved
                            </span>
                          )}

                          {/* rejected */}
                          {p.status === 'rejected' && (
                            <button
                              onClick={() => setResubmitPlan(p)}
                              className="px-2.5 py-1 text-xs border border-[#EF9F27] text-[#BA7517] rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              Edit &amp; Resubmit
                            </button>
                          )}

                          {/* overdue */}
                          {p.status === 'overdue' && (
                            <button
                              onClick={() => submitPlan.mutate(p._id)}
                              disabled={submitPlan.isPending}
                              className="px-2.5 py-1 text-xs border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {submitPlan.isPending && <Spin />}
                              Submit Now
                            </button>
                          )}

                        </div>
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
