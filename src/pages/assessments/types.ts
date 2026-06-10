// ============================================================
// ASSESSMENT MODULE — TYPES + CONSTANTS
// Eldermin ERP | React + TypeScript
// ============================================================

// ── Types ─────────────────────────────────────────────────────
export type AssessmentType =
  | 'quiz' | 'class_test' | 'unit_test' | 'mid_term' | 'final_exam'
  | 'assignment' | 'project' | 'practical' | 'oral';

export type AssessmentStatus =
  | 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'result_published' | 'cancelled';

export type QuestionType = 'mcq' | 'short' | 'long' | 'true_false' | 'fill_blank' | 'matching';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface SubjectConfig {
  subject: string;
  totalMarks: number;
  passingMarks: number;
  examiner?: string;
  date?: string;
  startTime?: string;
  duration?: number;
  venue?: string;
}

export interface Assessment {
  _id: string;
  title: string;
  description?: string;
  type: AssessmentType;
  grade: string;
  section?: string;
  academicYear: string;
  term?: string;
  subjects: SubjectConfig[];
  startDate: string;
  endDate?: string;
  status: AssessmentStatus;
  resultPublished: boolean;
  gradeCardsGenerated: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface QuestionOption {
  _id?: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  subject: string;
  grade: string;
  topic?: string;
  chapter?: string;
  type: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: Difficulty;
  questionText: string;
  options: QuestionOption[];
  correctAnswer?: string;
  marks: number;
  tags: string[];
  usageCount: number;
  addedBy?: string;
  createdAt: string;
}

export interface MarkEntry {
  _id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  section?: string;
  subject: string;
  totalMarks: number;
  obtainedMarks?: number;
  isAbsent: boolean;
  percentage?: number;
  grade_result?: string;
  result?: 'pass' | 'fail' | 'absent' | 'exempt';
  verified: boolean;
  remarks?: string;
}

export interface SubjectReport {
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  result: string;
}

export interface ReportCard {
  _id: string;
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  grade: string;
  section?: string;
  academicYear: string;
  term?: string;
  subjects: SubjectReport[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallGPA: number;
  overallResult: 'pass' | 'fail';
  classPosition?: number;
  totalStudents?: number;
  classTeacherRemarks?: string;
  principalRemarks?: string;
  published: boolean;
}

// ── Constants ─────────────────────────────────────────────────
export const ASSESSMENT_TYPES = [
  { value: 'quiz',        label: 'Quiz',         color: 'bg-blue-100 text-blue-700' },
  { value: 'class_test',  label: 'Class Test',   color: 'bg-indigo-100 text-indigo-700' },
  { value: 'unit_test',   label: 'Unit Test',    color: 'bg-purple-100 text-purple-700' },
  { value: 'mid_term',    label: 'Mid Term',     color: 'bg-amber-100 text-amber-700' },
  { value: 'final_exam',  label: 'Final Exam',   color: 'bg-red-100 text-red-700' },
  { value: 'assignment',  label: 'Assignment',   color: 'bg-teal-100 text-teal-700' },
  { value: 'project',     label: 'Project',      color: 'bg-emerald-100 text-emerald-700' },
  { value: 'practical',   label: 'Practical',    color: 'bg-orange-100 text-orange-700' },
  { value: 'oral',        label: 'Oral',         color: 'bg-pink-100 text-pink-700' },
];

export const ASSESSMENT_STATUSES = [
  { value: 'draft',            label: 'Draft',           color: 'bg-gray-100 text-gray-600' },
  { value: 'scheduled',        label: 'Scheduled',       color: 'bg-blue-100 text-blue-700' },
  { value: 'ongoing',          label: 'Ongoing',         color: 'bg-amber-100 text-amber-700' },
  { value: 'completed',        label: 'Completed',       color: 'bg-purple-100 text-purple-700' },
  { value: 'result_published', label: 'Results Live',    color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled',        label: 'Cancelled',       color: 'bg-red-100 text-red-700' },
];

export const QUESTION_TYPES = [
  { value: 'mcq',        label: 'Multiple Choice' },
  { value: 'short',      label: 'Short Answer' },
  { value: 'long',       label: 'Long Answer' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'matching',   label: 'Matching' },
];

export const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy',   color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'hard',   label: 'Hard',   color: 'bg-red-100 text-red-700' },
];

export const BLOOMS_LEVELS = [
  { value: 'remember',   label: 'Remember',   color: 'bg-blue-50 text-blue-600' },
  { value: 'understand', label: 'Understand', color: 'bg-indigo-50 text-indigo-600' },
  { value: 'apply',      label: 'Apply',      color: 'bg-purple-50 text-purple-600' },
  { value: 'analyze',    label: 'Analyze',    color: 'bg-amber-50 text-amber-600' },
  { value: 'evaluate',   label: 'Evaluate',   color: 'bg-orange-50 text-orange-600' },
  { value: 'create',     label: 'Create',     color: 'bg-red-50 text-red-600' },
];

export const GRADES = [
  'Pre-Nursery','Nursery','KG-1','KG-2',
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8',
  'Grade 9','Grade 10','Grade 11','Grade 12',
];

export const SUBJECTS = [
  'English','Mathematics','Science','Urdu','Islamiat',
  'Social Studies','Computer Science','Physics','Chemistry',
  'Biology','History','Geography','Economics','Accounting',
  'Pakistan Studies','Arabic','Art','Physical Education',
];

export const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-600 bg-emerald-50',
  'A':  'text-green-600 bg-green-50',
  'B+': 'text-blue-600 bg-blue-50',
  'B':  'text-indigo-600 bg-indigo-50',
  'C':  'text-amber-600 bg-amber-50',
  'D':  'text-orange-600 bg-orange-50',
  'F':  'text-red-600 bg-red-50',
};

export const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Annual'];
