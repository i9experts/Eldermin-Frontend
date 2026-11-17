import api from '../lib/api'

export type ParentFeatureKey =
  | 'school_diary'
  | 'quiz'
  | 'tarbiyah_report'
  | 'academic_progress_report'
  | 'tarbiyah_at_home'
  | 'hygiene_checklist'

export const PARENT_FEATURE_LABELS: Record<ParentFeatureKey, string> = {
  school_diary: 'School Diary / Circulars',
  quiz: 'Quiz',
  tarbiyah_report: 'Tarbiyah Report',
  academic_progress_report: 'Academic Progress Report',
  tarbiyah_at_home: 'Tarbiyah at Home',
  hygiene_checklist: 'Hygiene Checklist',
}

// hygiene_checklist has no parent-facing endpoint yet on the backend, so
// toggling it currently has no visible effect in the parent app — still
// shown (forward-compatible), just called out in the UI.
export const PARENT_FEATURE_KEYS: ParentFeatureKey[] = [
  'school_diary', 'quiz', 'tarbiyah_report', 'academic_progress_report', 'tarbiyah_at_home', 'hygiene_checklist',
]
export const UNENFORCED_FEATURES: ParentFeatureKey[] = ['hygiene_checklist']

export interface ParentFeatureHistoryEntry {
  action: 'suspended' | 'restored'
  reason?: string
  byUserId: string
  byName: string
  at: string
}

export interface ParentFeatureState {
  suspended: boolean
  reason: string | null
  suspendedAt: string | null
  restoredAt: string | null
  history: ParentFeatureHistoryEntry[]
}

export interface ParentFeatureAccess {
  parentUserId: string
  studentId: string
  student: { firstName: string; lastName: string; grade?: string; section?: string } | null
  features: Record<ParentFeatureKey, ParentFeatureState>
}

export interface LinkedParent {
  parentUserId: string
  name: string
  phone: string | null
  email: string | null
}

export interface RestrictedParentRow {
  parentUserId: string
  studentId: string
  student: { firstName: string; lastName: string; currentGrade?: string; currentSection?: string } | null
  suspendedFeatures: ParentFeatureKey[]
}

const parentAccessControlService = {
  listParentsForStudent: async (studentId: string): Promise<LinkedParent[]> => {
    const { data } = await api.get(`/parent-access-control/students/${studentId}/parents`)
    return data
  },
  getAccess: async (studentId: string, parentUserId: string): Promise<ParentFeatureAccess> => {
    const { data } = await api.get(`/parent-access-control/students/${studentId}/parents/${parentUserId}`)
    return data
  },
  setAccess: async (
    studentId: string,
    parentUserId: string,
    payload: { features: ParentFeatureKey[]; action: 'suspend' | 'restore'; reason?: string },
  ): Promise<ParentFeatureAccess> => {
    const { data } = await api.patch(`/parent-access-control/students/${studentId}/parents/${parentUserId}`, payload)
    return data
  },
  listRestricted: async (campusId?: string): Promise<RestrictedParentRow[]> => {
    const { data } = await api.get('/parent-access-control/restricted', { params: { campusId: campusId || undefined } })
    return data
  },
}

export default parentAccessControlService
