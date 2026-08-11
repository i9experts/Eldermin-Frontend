import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FileText, Plus, Download, Trash2, X, Save, Globe, Scan } from 'lucide-react';
import * as assessmentApi from '../../services/assessment.api';
import academicsService from '../../services/academics.service';
import organizationService from '../../services/organization.service';
import OMRManager from './OMRManager';

const LANGUAGES = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'urdu', label: 'اردو (Urdu)', flag: '🇵🇰' },
  { value: 'arabic', label: 'العربية (Arabic)', flag: '🇸🇦' },
];

type SectionDraft = { title: string; instructions: string; questionIds: string[] };

export default function PaperGenerationTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [omrPaper, setOmrPaper] = useState<any | null>(null);

  const { data: papers = [], isLoading } = useQuery({ queryKey: ['exam-papers'], queryFn: () => assessmentApi.fetchExamPapers() });

  const deletePaper = useMutation({
    mutationFn: (id: string) => assessmentApi.deleteExamPaper(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-papers'] });
      toast.success('Paper deleted');
    },
  });

  if (omrPaper) {
    return <OMRManager paper={omrPaper} onBack={() => setOmrPaper(null)} />;
  }

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  async function handleDownload(p: any) {
    setDownloadingId(p._id);
    try {
      await assessmentApi.downloadExamPaperPdf(p._id, p.title);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Paper Generation</h2>
          <p className="text-xs text-gray-400">Compile real Question Bank items into a formatted, printable paper — English, Urdu, or Arabic</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={14} /> New Paper
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4 text-xs text-blue-800">
        <strong>Note:</strong> this generates and formats papers with a real QR code for identification. Automated scan-checking of completed answer sheets (OMR) is a separate capability, not included here.
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (papers as any[]).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No papers yet</p>
          <p className="text-sm text-gray-400">Create your first paper from real questions in the Question Bank.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(papers as any[]).map((p: any) => {
            const lang = LANGUAGES.find((l) => l.value === p.language);
            return (
              <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-800">{p.title}</p>
                  <span className="text-xs">{lang?.flag} {lang?.label}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{p.subject} — {p.grade}{p.section ? ` (${p.section})` : ''} · {p.academicYear}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span>{p.questionCount} question{p.questionCount !== 1 ? 's' : ''}</span>
                  <span>{p.totalMarks} marks</span>
                  <span>{p.duration} min</span>
                  <span className="font-mono">{p.paperCode}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(p)}
                    disabled={downloadingId === p._id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download size={12} /> {downloadingId === p._id ? 'Generating…' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => setOmrPaper(p)}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                    title="Generate and scan OMR answer sheets for this paper"
                  >
                    <Scan size={12} /> Scan
                  </button>
                  <button onClick={() => deletePaper.mutate(p._id)} className="text-xs text-red-500 hover:bg-red-50 rounded-lg px-2">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreatePaperModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreatePaperModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('');
  const [language, setLanguage] = useState('english');
  const [duration, setDuration] = useState(60);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [sections, setSections] = useState<SectionDraft[]>([{ title: 'Section A', instructions: '', questionIds: [] }]);

  const { data: realSubjects = [] } = useQuery({ queryKey: ['subjects-for-papers'], queryFn: () => academicsService.getSubjects() });
  const { data: realGrades = [] } = useQuery({ queryKey: ['grades-for-papers'], queryFn: () => organizationService.getGrades() });
  const { data: bankQuestions = [] } = useQuery({
    queryKey: ['questions-for-paper', subject, grade],
    queryFn: () => assessmentApi.fetchQuestions({ subject, grade }),
    enabled: !!subject && !!grade,
  });
  const questionList: any[] = (bankQuestions as any)?.data || bankQuestions || [];

  const createPaper = useMutation({
    mutationFn: () => assessmentApi.createExamPaper({
      title, subject, grade, section: section || undefined, academicYear, term: term || undefined,
      language, duration, generalInstructions: generalInstructions || undefined,
      sections: sections.map((s) => ({ title: s.title, instructions: s.instructions || undefined, questionIds: s.questionIds })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-papers'] });
      toast.success('Paper created');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create paper'),
  });

  function addSection() {
    setSections((prev) => [...prev, { title: `Section ${String.fromCharCode(65 + prev.length)}`, instructions: '', questionIds: [] }]);
  }
  function updateSection(i: number, field: keyof SectionDraft, value: any) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }
  function toggleQuestion(sectionIdx: number, questionId: string) {
    setSections((prev) => prev.map((s, idx) => {
      if (idx !== sectionIdx) return s;
      const has = s.questionIds.includes(questionId);
      return { ...s, questionIds: has ? s.questionIds.filter((q) => q !== questionId) : [...s.questionIds, questionId] };
    }));
  }

  function handleSave() {
    if (!title || !subject || !grade || !academicYear) { toast.error('Title, Subject, Grade, and Academic Year are required'); return; }
    if (sections.every((s) => s.questionIds.length === 0)) { toast.error('Add at least one question to a section'); return; }
    createPaper.mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-gray-900">New Exam Paper</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Term Examination — Mathematics" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Select…</option>
                {(realSubjects as any[]).map((s: any) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Grade *</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Select…</option>
                {(realGrades as any[]).map((g: any) => <option key={g._id} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Section (optional)</label>
              <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year *</label>
              <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2025-26" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Term</label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. Term 1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (minutes) *</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Globe size={12} /> Paper Language *</label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.value} onClick={() => setLanguage(l.value)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${language === l.value ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
            {language !== 'english' && (
              <p className="text-[10px] text-gray-400 mt-1">Renders right-to-left with real Arabic-script fonts. Note: renders in Naskh style, not Nastaliq calligraphy.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">General Instructions</label>
            <textarea value={generalInstructions} onChange={(e) => setGeneralInstructions(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="e.g. Attempt all questions. Write in blue or black ink only." />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600">Sections</p>
              {!subject || !grade ? <p className="text-xs text-amber-600">Select Subject and Grade to pick questions</p> : null}
            </div>
            <div className="space-y-3">
              {sections.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-2 mb-2">
                    <input value={s.title} onChange={(e) => updateSection(i, 'title', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold" />
                    <input value={s.instructions} onChange={(e) => updateSection(i, 'instructions', e.target.value)} placeholder="Section instructions (optional)" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                  </div>
                  {subject && grade && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {questionList.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">No questions in the bank for this subject/grade yet.</p>
                      ) : (
                        questionList.map((q: any) => (
                          <label key={q._id} className="flex items-start gap-2 text-xs px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input type="checkbox" checked={s.questionIds.includes(q._id)} onChange={() => toggleQuestion(i, q._id)} className="mt-0.5" />
                            <span className="flex-1">{q.questionText}</span>
                            <span className="text-gray-400 shrink-0">[{q.marks}]</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{s.questionIds.length} question{s.questionIds.length !== 1 ? 's' : ''} selected</p>
                </div>
              ))}
            </div>
            <button onClick={addSection} className="text-xs text-[#1e3a5f] font-medium hover:underline mt-2">+ Add Section</button>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={createPaper.isPending} className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[#1e3a5f] text-white rounded-lg disabled:opacity-50">
            <Save size={12} /> {createPaper.isPending ? 'Saving…' : 'Create Paper'}
          </button>
        </div>
      </div>
    </div>
  );
}
