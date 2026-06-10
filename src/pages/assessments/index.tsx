// ============================================================
// ASSESSMENT — MODALS + MAIN INDEX
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import { X, Save, Calendar, Plus, Trash2, CheckCircle, Send, BookOpen, ClipboardList, BarChart2, FileText, Award, TrendingUp } from 'lucide-react';
import { ASSESSMENT_TYPES, GRADES, SUBJECTS, TERMS, QUESTION_TYPES, DIFFICULTY_OPTIONS, BLOOMS_LEVELS, Assessment } from './types';
import { AssessmentDashboard, PlannerTab, StatCard, StatusBadge, TypeBadge } from './DashboardPlannerTabs';
import { QuestionBankTab, MarkEntryTab, ResultsTab, AnalyticsTab } from './OtherTabs';

// ── Shared Form Components ────────────────────────────────────
const ModalWrapper: React.FC<{ title: string; subtitle?: string; onClose: () => void; size?: 'md'|'lg'|'xl'; footer?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, onClose, size = 'lg', footer, children }) => {
  const w = { md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${w} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-gray-100 p-4 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; required?: boolean; span?: boolean; children: React.ReactNode }> = ({ label, required, span, children }) => (
  <div className={span ? 'col-span-2' : ''}>
    <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-600">{children}</select>
);

const Btn = (color: string) => ({ onClick, children, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 ${color} text-xs px-5 py-2.5 rounded-lg font-medium transition-colors`}>
    {icon}{children}
  </button>
);

const BtnPrimary = Btn('bg-[#1e3a5f] text-white hover:bg-[#16304f]');
const BtnSecondary = Btn('border border-gray-200 text-gray-600 hover:bg-gray-50');
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-2 mt-4 mb-3">
    <p className="text-[10px] font-bold text-[#1e3a5f] uppercase tracking-wider">{title}</p>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

// ── Create Assessment Modal ───────────────────────────────────
export const CreateAssessmentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [subjects, setSubjects] = useState([{ subject: '', totalMarks: 100, passingMarks: 40, date: '', startTime: '', duration: 180, venue: '' }]);

  return (
    <ModalWrapper title="Create New Assessment" onClose={onClose} size="xl"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Save size={12} />}>Create Assessment</BtnPrimary></>}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title" required span><Input placeholder="e.g. Mid Term Examination 2025" /></Field>
          <Field label="Type" required>
            <Select><option value="">Select Type</option>{ASSESSMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
          </Field>
          <Field label="Grade" required>
            <Select><option value="">Select Grade</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</Select>
          </Field>
          <Field label="Section">
            <Select><option>All Sections</option><option>A</option><option>B</option><option>C</option></Select>
          </Field>
          <Field label="Term">
            <Select><option>Select Term</option>{TERMS.map(t => <option key={t} value={t}>{t}</option>)}</Select>
          </Field>
          <Field label="Academic Year">
            <Select defaultValue="2025-26"><option value="2025-26">2025–26</option><option value="2024-25">2024–25</option></Select>
          </Field>
          <Field label="Start Date" required><Input type="date" /></Field>
          <Field label="End Date"><Input type="date" /></Field>
        </div>

        <SectionHeader title="Subjects Configuration" />
        {subjects.map((s, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 p-3 bg-gray-50 rounded-xl items-end">
            <div className="col-span-2">
              <p className="text-[10px] text-gray-500 mb-1">Subject</p>
              <Select value={s.subject} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, subject: e.target.value } : x))}>
                <option value="">Select Subject</option>
                {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </Select>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Total Marks</p>
              <Input type="number" value={s.totalMarks} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, totalMarks: +e.target.value } : x))} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Passing</p>
              <Input type="number" value={s.passingMarks} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, passingMarks: +e.target.value } : x))} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-1">Date</p>
              <Input type="date" value={s.date} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} />
            </div>
            <div className="flex items-end">
              <button onClick={() => setSubjects(prev => prev.filter((_, j) => j !== i))}
                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        <button onClick={() => setSubjects(prev => [...prev, { subject: '', totalMarks: 100, passingMarks: 40, date: '', startTime: '', duration: 180, venue: '' }])}
          className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium hover:underline mt-1">
          <Plus size={12} /> Add Subject
        </button>
      </div>
    </ModalWrapper>
  );
};

// ── Add Question Modal ────────────────────────────────────────
export const AddQuestionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [qType, setQType] = useState('mcq');
  const [options, setOptions] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]);

  return (
    <ModalWrapper title="Add Question to Bank" onClose={onClose} size="lg"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Save size={12} />}>Save Question</BtnPrimary></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject" required>
            <Select><option value="">Select</option>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Grade" required>
            <Select><option value="">Select</option>{GRADES.map(g => <option key={g}>{g}</option>)}</Select>
          </Field>
          <Field label="Topic"><Input placeholder="e.g. Algebra, Grammar" /></Field>
          <Field label="Chapter"><Input placeholder="e.g. Chapter 3" /></Field>
          <Field label="Question Type" required>
            <Select value={qType} onChange={e => setQType(e.target.value)}>
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select>
          </Field>
          <Field label="Bloom's Level">
            <Select>{BLOOMS_LEVELS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</Select>
          </Field>
          <Field label="Marks"><Input type="number" defaultValue={1} /></Field>
        </div>
        <Field label="Question Text" required span>
          <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 resize-none" placeholder="Enter the question..." />
        </Field>
        {qType === 'mcq' && (
          <div>
            <SectionHeader title="Answer Options" />
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="radio" name="correct" checked={opt.isCorrect}
                  onChange={() => setOptions(prev => prev.map((o, j) => ({ ...o, isCorrect: j === i })))}
                  className="flex-shrink-0" />
                <Input placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt.text} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, text: e.target.value } : o))} />
              </div>
            ))}
            <p className="text-[10px] text-gray-400">Select the radio button next to the correct answer</p>
          </div>
        )}
        {(qType === 'short' || qType === 'fill_blank') && (
          <Field label="Model Answer">
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none resize-none text-gray-700" placeholder="Expected correct answer..." />
          </Field>
        )}
        <Field label="Tags (comma separated)">
          <Input placeholder="e.g. algebra, equations, grade9" />
        </Field>
      </div>
    </ModalWrapper>
  );
};

// ── Generate Report Cards Modal ───────────────────────────────
export const GenerateReportCardsModal: React.FC<{ assessment?: Assessment; onClose: () => void }> = ({ assessment, onClose }) => (
  <ModalWrapper title="Generate Report Cards" subtitle={assessment?.title} onClose={onClose} size="md"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<FileText size={12} />}>Generate Now</BtnPrimary></>}>
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800">
          <p className="font-semibold mb-1">Before generating report cards:</p>
          <ul className="space-y-0.5 list-disc list-inside text-blue-700">
            <li>All marks must be entered for all subjects</li>
            <li>Marks should be verified by subject teachers</li>
            <li>Class positions will be calculated automatically</li>
          </ul>
        </div>
      </div>
      {assessment && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-700">{assessment.title}</p>
          <p className="text-[10px] text-gray-500">{assessment.grade} · {assessment.type} · {assessment.startDate}</p>
          <p className="text-[10px] text-gray-500">{assessment.subjects.length} subjects configured</p>
        </div>
      )}
      <div className="space-y-2">
        {['Add class teacher remarks after generation', 'Auto-calculate class positions', 'Include absent students in report'].map(opt => (
          <label key={opt} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" defaultChecked={opt !== 'Include absent'} className="rounded" />{opt}
          </label>
        ))}
      </div>
    </div>
  </ModalWrapper>
);

// ── Publish Results Modal ─────────────────────────────────────
export const PublishResultsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalWrapper title="Publish Results" onClose={onClose} size="md"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
      <button className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-700 font-medium">
        <Send size={12} /> Publish Now
      </button></>}>
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Publishing results will make them visible to parents and students via their dashboards. This action cannot be undone.</p>
      </div>
      <Field label="Select Assessment">
        <Select><option>Weekly Math Quiz — Grade 7</option><option>English Assignment — Grade 5</option></Select>
      </Field>
      <div className="space-y-2">
        {['Notify parents via SMS', 'Notify parents via email', 'Show on student dashboard'].map(opt => (
          <label key={opt} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />{opt}
          </label>
        ))}
      </div>
    </div>
  </ModalWrapper>
);

// ============================================================
// MAIN INDEX — AssessmentModule
// ============================================================
const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={14} /> },
  { key: 'planner', label: 'Planner', icon: <Calendar size={14} />, badge: '3' },
  { key: 'questions', label: 'Question Bank', icon: <BookOpen size={14} />, badge: '342' },
  { key: 'marks', label: 'Mark Entry', icon: <ClipboardList size={14} />, badge: '2' },
  { key: 'results', label: 'Results', icon: <Award size={14} /> },
  { key: 'analytics', label: 'Analytics', icon: <TrendingUp size={14} /> },
] as const;

type TabKey = typeof TABS[number]['key'];

const DEFAULT_MODALS = {
  createAssessment: false, editAssessment: false, viewAssessment: false,
  addQuestion: false, editQuestion: false, deleteQuestion: false,
  bulkMarkEntry: false, verifyMarks: false,
  generateReportCards: false, viewReportCard: false,
  publishResults: false, confirmAction: false,
};

const AssessmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [modals, setModals] = useState(DEFAULT_MODALS);
  const [selectedData, setSelectedData] = useState<any>(null);

  const openModal = (modal: string, data?: any) => {
    setSelectedData(data);
    setModals(prev => ({ ...DEFAULT_MODALS, [modal]: true }));
  };
  const closeModals = () => { setModals(DEFAULT_MODALS); setSelectedData(null); };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AssessmentDashboard />;
      case 'planner': return <PlannerTab onOpenModal={openModal} />;
      case 'questions': return <QuestionBankTab onOpenModal={openModal} />;
      case 'marks': return <MarkEntryTab onOpenModal={openModal} />;
      case 'results': return <ResultsTab onOpenModal={openModal} />;
      case 'analytics': return <AnalyticsTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1e3a5f] to-indigo-400 rounded-xl flex items-center justify-center">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Assessment Module</h1>
              <p className="text-xs text-gray-400">Academic Year 2025–26 · Spring Term</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openModal('createAssessment')}
              className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium shadow-sm">
              <Plus size={13} /> New Assessment
            </button>
            <button onClick={() => openModal('addQuestion')}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
              <BookOpen size={13} /> Add Question
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all
                ${activeTab === tab.key ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
              {tab.icon} {tab.label}
              {(tab as any).badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {(tab as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>

      {/* Modals */}
      {modals.createAssessment && <CreateAssessmentModal onClose={closeModals} />}
      {modals.addQuestion && <AddQuestionModal onClose={closeModals} />}
      {modals.generateReportCards && <GenerateReportCardsModal assessment={selectedData} onClose={closeModals} />}
      {modals.publishResults && <PublishResultsModal onClose={closeModals} />}
    </div>
  );
};

export default AssessmentModule;
