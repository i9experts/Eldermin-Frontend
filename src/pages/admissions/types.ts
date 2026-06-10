// ============================================================
// ADMISSION LIFECYCLE MODULE — TYPES
// Eldermin ERP | Education Operating System
// ============================================================

export type LeadSource =
  | 'website'
  | 'referral'
  | 'social_media'
  | 'walk_in'
  | 'phone_call'
  | 'education_fair'
  | 'advertisement'
  | 'agent'
  | 'alumni';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'not_interested'
  | 'follow_up'
  | 'converted'
  | 'lost';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'waitlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ApplicationStage =
  | 'application'
  | 'document_review'
  | 'entrance_test'
  | 'interview'
  | 'decision'
  | 'enrollment';

export type EvaluationStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type EnrollmentStatus =
  | 'pending_fee'
  | 'fee_paid'
  | 'documents_pending'
  | 'enrolled'
  | 'deferred';

export type RetentionStatus =
  | 'active'
  | 'at_risk'
  | 'withdrawn'
  | 're_enrolled'
  | 'waitlisted';

export type Gender = 'male' | 'female';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// ── Lead ─────────────────────────────────────────────────────
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gradeInterested: string;
  source: LeadSource;
  status: LeadStatus;
  priority: Priority;
  assignedTo: string;
  campaign?: string;
  notes: string;
  followUpDate: string;
  createdAt: string;
  lastContactedAt?: string;
  convertedToApplicantId?: string;
  tags: string[];
  campusPreference?: string;
}

// ── Document ─────────────────────────────────────────────────
export interface SubmittedDocument {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  uploadedAt: string;
  verifiedBy?: string;
  remarks?: string;
  fileUrl?: string;
}

// ── Applicant ────────────────────────────────────────────────
export interface Applicant {
  id: string;
  applicationNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  religion?: string;
  gradeApplied: string;
  previousSchool: string;
  previousGrade: string;
  lastGPA?: string;
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  city: string;
  status: ApplicationStatus;
  stage: ApplicationStage;
  submittedAt: string;
  updatedAt: string;
  documents: SubmittedDocument[];
  leadId?: string;
  assignedTo: string;
  campusId: string;
  academicYear: string;
  notes?: string;
  siblingInSchool?: boolean;
  specialNeeds?: boolean;
  specialNeedsDetail?: string;
}

// ── Evaluation ───────────────────────────────────────────────
export interface EntranceTest {
  id: string;
  applicantId: string;
  applicantName: string;
  scheduledDate: string;
  scheduledTime: string;
  venue: string;
  subjects: string[];
  status: EvaluationStatus;
  maxScore: number;
  obtainedScore?: number;
  percentage?: number;
  result?: 'pass' | 'fail' | 'borderline';
  examiner?: string;
  remarks?: string;
}

export interface Interview {
  id: string;
  applicantId: string;
  applicantName: string;
  scheduledDate: string;
  scheduledTime: string;
  interviewers: string[];
  type: 'student' | 'parent' | 'both';
  status: EvaluationStatus;
  scores?: InterviewScore[];
  decision?: 'recommended' | 'not_recommended' | 'borderline';
  remarks?: string;
}

export interface InterviewScore {
  criteria: string;
  score: number;
  maxScore: number;
}

// ── Enrollment ───────────────────────────────────────────────
export interface Enrollment {
  id: string;
  applicantId: string;
  applicationNumber: string;
  studentName: string;
  gradeEnrolled: string;
  section?: string;
  campusId: string;
  academicYear: string;
  status: EnrollmentStatus;
  admissionFee: number;
  admissionFeePaid: boolean;
  feePaidDate?: string;
  feeReceiptNumber?: string;
  classAssigned?: string;
  rollNumber?: string;
  enrolledAt?: string;
  uniformIssued?: boolean;
  idCardIssued?: boolean;
  documentsComplete: boolean;
  orientationDate?: string;
  studentId?: string;
}

// ── Retention ────────────────────────────────────────────────
export interface RetentionRecord {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  academicYear: string;
  status: RetentionStatus;
  reEnrollmentStatus?: 'pending' | 'confirmed' | 'declined';
  withdrawalReason?: string;
  withdrawalDate?: string;
  atRiskFactors?: string[];
  counsellorAssigned?: string;
  lastInteractionDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  waitlistPosition?: number;
}

// ── Reports & Analytics ──────────────────────────────────────
export interface AdmissionStats {
  totalLeads: number;
  leadsThisMonth: number;
  totalApplications: number;
  submitted: number;
  underReview: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
  enrolled: number;
  conversionRate: number;
  leadToApplicationRate: number;
  applicationToEnrollmentRate: number;
  averageProcessingDays: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

// ── Modal state helpers ───────────────────────────────────────
export interface ModalState {
  addLead: boolean;
  viewLead: boolean;
  convertLead: boolean;
  addApplicant: boolean;
  viewApplicant: boolean;
  scheduleTest: boolean;
  scheduleInterview: boolean;
  viewEvaluation: boolean;
  processEnrollment: boolean;
  viewEnrollment: boolean;
  viewRetention: boolean;
  generateReport: boolean;
}

export type ModalKey = keyof ModalState;
