// ============================================================
// ADMISSION LIFECYCLE MODULE — CONSTANTS
// Eldermin ERP | Education Operating System
// ============================================================

// ── Option lists ─────────────────────────────────────────────
export const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'education_fair', label: 'Education Fair' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'agent', label: 'Agent' },
  { value: 'alumni', label: 'Alumni' },
];

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-700' },
  { value: 'interested', label: 'Interested', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-gray-100 text-gray-600' },
  { value: 'follow_up', label: 'Follow Up', color: 'bg-amber-100 text-amber-700' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

export const APPLICATION_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  { value: 'under_review', label: 'Under Review', color: 'bg-purple-100 text-purple-700' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-amber-100 text-amber-700' },
  { value: 'waitlisted', label: 'Waitlisted', color: 'bg-orange-100 text-orange-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' },
];

export const APPLICATION_STAGES = [
  { value: 'application', label: 'Application', step: 1 },
  { value: 'document_review', label: 'Document Review', step: 2 },
  { value: 'entrance_test', label: 'Entrance Test', step: 3 },
  { value: 'interview', label: 'Interview', step: 4 },
  { value: 'decision', label: 'Decision', step: 5 },
  { value: 'enrollment', label: 'Enrollment', step: 6 },
];

export const GRADES = [
  'Pre-Nursery', 'Nursery', 'KG-1', 'KG-2',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8',
  'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

