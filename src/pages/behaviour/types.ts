// ============================================================
// BEHAVIOUR & TARBIYAH — TYPES + CONSTANTS
// Eldermin ERP | React + TypeScript
// ============================================================

// Grade/section on a BehaviourRecord, TarbiyahAssessment, Qaida/Nazra
// progress record (and the Student record they're all copied from at
// creation time) are free-text with no FK to the real Grade/Section
// master - some schools store the bare section ("A"), others bake the
// grade into it ("Grade 2A"). Concatenating grade + section naively then
// shows a duplicated class label like "GRADE-2 Grade 2A". Mirrors the
// normalizeGradeName/normalizeSectionName idiom already used server-side
// in class-match.util.ts for this same drift.
export const normalizeGradeForCompare = (v: string): string =>
  v.trim().toLowerCase().replace(/^(?:grade|class|standard|std|g)[\s\-_.]*(?=\d)/, '').replace(/\s+/g, '');

// Mirrors normalizeSectionName in the backend's class-match.util.ts: a
// section can be stored as the bare letter ("A") or with the grade baked
// in ("Grade 2A"), while the Section dropdown always sends the Section
// master's full name - strict equality against a bare-stored section
// previously matched nothing, exactly the "28 real assessments but the
// filtered view shows 0" bug this fixes.
export const normalizeSectionForCompare = (v?: string | null): string => {
  let s = (v || '').trim().toLowerCase().replace(/\s+/g, ' ');
  s = s.replace(/^(?:grade|class|standard|std|g)[\s\-_.]*\d+[\s\-_.]*/, '');
  s = s.replace(/^(?:section|sec)[\s\-_.:]+(?=\S)/, '');
  return s.replace(/\s+/g, '');
};

export function formatClassLabel(grade?: string | null, section?: string | null): string {
  const g = (grade || '').trim();
  const s = (section || '').trim();
  if (!g) return s;
  if (!s) return g;
  // Section already carries the grade (e.g. grade "GRADE-2", section
  // "Grade 2A") - show the section alone rather than doubling it up.
  if (normalizeGradeForCompare(s).startsWith(normalizeGradeForCompare(g))) return s;
  return `${g} ${s}`;
}

export type BehaviourType = 'positive' | 'negative' | 'neutral';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type TarbiyahRating = 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'critical';
export type InterventionTier = 'tier1_universal' | 'tier2_targeted' | 'tier3_intensive';

export interface BehaviourRecord {
  _id: string;
  studentId: string;
  studentName: string;
  grade: string;
  section?: string;
  date: string;
  type: BehaviourType;
  category: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  points: number;
  actionTaken?: string;
  consequence?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  resolved: boolean;
  parentNotified: boolean;
  reportedBy: string;
  verified: boolean;
  academicYear: string;
}

export interface TarbiyahTrait {
  key: string;
  nameEn: string;
  nameAr: string;
  category: string;
}

export interface TraitScore {
  traitKey: string;
  score: number;
  observation?: string;
}

export interface TarbiyahAssessment {
  _id: string;
  studentId: string;
  studentName: string;
  grade: string;
  section?: string;
  period: string;
  periodType: string;
  assessmentDate: string;
  traits: TraitScore[];
  overallScore: number;
  overallPercentage: number;
  overallRating: TarbiyahRating;
  teacherObservations?: string;
  areasOfStrength: string[];
  areasForImprovement: string[];
  assessedBy: string;
  parentShared: boolean;
  academicYear?: string;
}

export interface CounsellingSession {
  _id: string;
  studentId: string;
  studentName: string;
  grade: string;
  sessionDate: string;
  sessionTime?: string;
  duration?: number;
  type: string;
  format: string;
  referredBy: string;
  referralReason?: string;
  counsellor: string;
  sessionNotes?: string;
  studentResponse?: string;
  actionPlan?: string;
  goals?: string[];
  status: string;
  followUpRequired: boolean;
  nextSessionDate?: string;
  parentInformed: boolean;
  parentPresent?: boolean;
  confidential: boolean;
  academicYear?: string;
}

export interface InterventionAction {
  _id: string;
  action: string;
  responsible: string;
  dueDate?: string;
  status: string;
  completionNote?: string;
}

export interface Intervention {
  _id: string;
  studentId: string;
  studentName: string;
  grade: string;
  title: string;
  type: string;
  tier: InterventionTier;
  concern: string;
  rootCause?: string;
  rootCauseTags?: string[];
  interviewCategory?: string;
  interviewQA?: { question: string; answer: string }[];
  interviewSummary?: string;
  goals: string[];
  strategies: string[];
  actions: InterventionAction[];
  startDate: string;
  reviewDate?: string;
  status: string;
  outcome?: string;
  team: string[];
  createdBy: string;
  parentConsented?: boolean;
  parentConsentDate?: string;
  escalated?: boolean;
  escalatedDate?: string;
  escalatedTo?: string;
  escalationNote?: string;
  progressNotes: { date: string; note: string; addedBy: string }[];
  academicYear?: string;
}

// ── Constants ─────────────────────────────────────────────────
export const TYPE_CONFIG: Record<BehaviourType, { label: string; color: string; bg: string; border: string }> = {
  positive: { label: 'Positive', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  negative: { label: 'Negative', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' },
  neutral:  { label: 'Neutral',  color: 'text-blue-700',  bg: 'bg-blue-100',    border: 'border-blue-200'  },
};

export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; dot: string }> = {
  low:      { label: 'Low',      color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
  medium:   { label: 'Medium',   color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'  },
  high:     { label: 'High',     color: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700',      dot: 'bg-red-600'    },
};

export const TARBIYAH_RATING_CONFIG: Record<TarbiyahRating, { label: string; color: string; stars: number }> = {
  excellent:        { label: 'Excellent (Mumtaz)',   color: 'text-emerald-600 bg-emerald-50', stars: 5 },
  good:             { label: 'Good (Jayyid)',         color: 'text-blue-600 bg-blue-50',       stars: 4 },
  satisfactory:     { label: 'Satisfactory (Maqbool)',color: 'text-amber-600 bg-amber-50',     stars: 3 },
  needs_improvement:{ label: 'Needs Improvement',    color: 'text-orange-600 bg-orange-50',   stars: 2 },
  critical:         { label: 'Critical Concern',     color: 'text-red-600 bg-red-50',         stars: 1 },
};

export const TARBIYAH_TRAITS: TarbiyahTrait[] = [
  { key: 'sidq',     nameEn: 'Truthfulness (Sidq)',       nameAr: 'الصدق',     category: 'character' },
  { key: 'amanah',   nameEn: 'Trustworthiness (Amanah)',  nameAr: 'الأمانة',   category: 'character' },
  { key: 'adab',     nameEn: 'Manners & Respect (Adab)',  nameAr: 'الأدب',     category: 'social'    },
  { key: 'ihsan',    nameEn: 'Excellence (Ihsan)',         nameAr: 'الإحسان',   category: 'academic'  },
  { key: 'sabr',     nameEn: 'Patience (Sabr)',            nameAr: 'الصبر',     category: 'character' },
  { key: 'tawadu',   nameEn: "Humility (Tawadu')",         nameAr: 'التواضع',   category: 'character' },
  { key: 'shukr',    nameEn: 'Gratitude (Shukr)',          nameAr: 'الشكر',     category: 'spiritual' },
  { key: 'ukhuwwah', nameEn: 'Brotherhood (Ukhuwwah)',     nameAr: 'الأخوة',    category: 'social'    },
  { key: 'ijtihad',  nameEn: 'Diligence (Ijtihad)',        nameAr: 'الاجتهاد',  category: 'academic'  },
  { key: 'nazafah',  nameEn: 'Cleanliness (Nazafah)',      nameAr: 'النظافة',   category: 'spiritual' },
  { key: 'itqan',    nameEn: 'Precision (Itqan)',          nameAr: 'الإتقان',   category: 'academic'  },
  { key: 'tawakkul', nameEn: 'Trust in Allah (Tawakkul)',  nameAr: 'التوكل',    category: 'spiritual' },
];

export const BEHAVIOUR_CATEGORIES = {
  positive: [
    'academic_excellence','helping_others','leadership',
    'good_conduct','community_service','innovation',
    'sportsmanship','attendance_excellence','moral_courage',
  ],
  negative: [
    'misconduct','bullying','cheating','dishonesty',
    'disrespect','property_damage','late_coming',
    'uniform_violation','phone_misuse','absenteeism',
    'fighting','harassment','vandalism',
  ],
  neutral: [
    'counselling_referral','parent_meeting','warning_issued',
    'behaviour_contract','restorative_practice',
  ],
};

export const CATEGORY_LABELS: Record<string, string> = {
  academic_excellence: 'Academic Excellence',
  helping_others: 'Helping Others',
  leadership: 'Leadership',
  good_conduct: 'Good Conduct',
  community_service: 'Community Service',
  innovation: 'Innovation',
  sportsmanship: 'Sportsmanship',
  attendance_excellence: 'Perfect Attendance',
  moral_courage: 'Moral Courage',
  misconduct: 'Misconduct',
  bullying: 'Bullying',
  cheating: 'Cheating',
  dishonesty: 'Dishonesty',
  disrespect: 'Disrespect',
  property_damage: 'Property Damage',
  late_coming: 'Late Coming',
  uniform_violation: 'Uniform Violation',
  phone_misuse: 'Phone Misuse',
  absenteeism: 'Absenteeism',
  fighting: 'Fighting',
  harassment: 'Harassment',
  vandalism: 'Vandalism',
  counselling_referral: 'Counselling Referral',
  parent_meeting: 'Parent Meeting',
  warning_issued: 'Warning Issued',
  behaviour_contract: 'Behaviour Contract',
  restorative_practice: 'Restorative Practice',
};

export const INTERVENTION_TIERS = [
  { value: 'tier1_universal', label: 'Tier 1 — Universal', desc: 'School-wide prevention',  color: 'bg-green-100 text-green-700' },
  { value: 'tier2_targeted',  label: 'Tier 2 — Targeted',  desc: 'Small group support',     color: 'bg-amber-100 text-amber-700' },
  { value: 'tier3_intensive', label: 'Tier 3 — Intensive', desc: 'Individual intensive',    color: 'bg-red-100 text-red-700'    },
];

// Diagnostic root-cause categories, used to tag an Intervention after the
// office interview (see the diagnostic question bank) - distinct from the
// free-text `rootCause`, so Reports can break referrals down by cause.
export const ROOT_CAUSE_TAGS = [
  { value: 'home',             label: 'Home / Family' },
  { value: 'academic',         label: 'Academic Struggle' },
  { value: 'peer_influence',   label: 'Peer Influence' },
  { value: 'emotional',        label: 'Emotional / Self-Esteem' },
  { value: 'digital_media',    label: 'Digital / Media Exposure' },
  { value: 'physical_health',  label: 'Physical / Health' },
  { value: 'spiritual',        label: 'Spiritual / Values' },
  { value: 'unclear',          label: 'Unclear / Needs Further Investigation' },
];

// Guided office-interview question bank for the Create Intervention Plan
// form - the admin picks the category that best fits what's happening,
// then works through its questions with the student, recording the
// answer to each one. This structured transcript is what the AI
// Suggestion is built from (see getInterventionAiSuggestion).
export const INTERVIEW_CATEGORIES: { value: string; label: string; questions: string[] }[] = [
  {
    value: 'general_school',
    label: 'General School / Conduct',
    questions: [
      "What happened today, in your own words?",
      "Has this kind of thing happened before? How often?",
      "Were other students involved? Who started it?",
      "What were you feeling right before it happened?",
      "If you could change one thing about how you acted, what would it be?",
    ],
  },
  {
    value: 'child_personal',
    label: 'Child / Personal',
    questions: [
      "On a scale of 1-10, how much do you feel like you belong in this class?",
      "Is there something you're good at that nobody at school really knows about?",
      "When do you feel most noticed by teachers - good reasons or bad reasons?",
      "Is there anything bothering you lately that you haven't told anyone?",
    ],
  },
  {
    value: 'classroom',
    label: 'Classroom',
    questions: [
      "Who do you usually sit with, and does that help or make things harder?",
      "When the teacher is explaining something, is it too fast, too slow, or just right?",
      "Is there a particular class or teacher where this happens more than others? Why do you think that is?",
      "What would make it easier for you to focus in class?",
    ],
  },
  {
    value: 'academic',
    label: 'Academic',
    questions: [
      "Which subjects do you enjoy? Which ones feel hard or boring?",
      "Is there a subject where you feel like you're falling behind and nobody's noticed?",
      "Do you understand the homework/classwork, or does it feel confusing most of the time?",
      "How do you feel about your grades compared to your classmates?",
    ],
  },
  {
    value: 'peer_social',
    label: 'Peer / Social',
    questions: [
      "Who do you usually spend break time with?",
      "When you get into trouble, is it usually your idea, or does it start with someone else?",
      "Has anyone ever made fun of you for following the rules?",
      "Do you feel pressure to act a certain way to fit in with your friends?",
    ],
  },
  {
    value: 'home_family',
    label: 'Home / Family',
    questions: [
      "Who do you live with at home? Tell me about a normal evening at your house.",
      "Is there anything happening at home right now that's been on your mind?",
      "Who do you talk to at home when something's bothering you?",
      "Has anything changed at home recently (new sibling, a move, a family member away)?",
    ],
  },
  {
    value: 'digital_media',
    label: 'Digital / Media',
    questions: [
      "What do you usually watch or play at home? How late do you stay up with it?",
      "Is there anyone online - games, videos, group chats - who gives you ideas about how to act?",
      "Do you have your own phone/tablet, and is anyone checking what you watch?",
    ],
  },
  {
    value: 'health',
    label: 'Health',
    questions: [
      "How are you sleeping lately?",
      "Do you ever feel restless or unable to sit still even when you're trying hard to?",
      "Have you been eating/feeling well lately, or is anything physically bothering you?",
    ],
  },
];

export const GRADES = [
  'Pre-Nursery','Nursery','KG-1','KG-2',
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8',
  'Grade 9','Grade 10','Grade 11','Grade 12',
];
