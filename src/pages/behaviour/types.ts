// ============================================================
// BEHAVIOUR & TARBIYAH — TYPES + CONSTANTS
// Eldermin ERP | React + TypeScript
// ============================================================

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
  goals: string[];
  strategies: string[];
  actions: InterventionAction[];
  startDate: string;
  reviewDate?: string;
  status: string;
  outcome?: string;
  team: string[];
  createdBy: string;
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

export const GRADES = [
  'Pre-Nursery','Nursery','KG-1','KG-2',
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8',
  'Grade 9','Grade 10','Grade 11','Grade 12',
];
