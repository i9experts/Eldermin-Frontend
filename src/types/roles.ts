// UserRole enum — add new roles here as needed
export enum UserRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Principal = 'principal',
  Teacher = 'teacher',
  Student = 'student',
  Parent = 'parent',
  FinanceOfficer = 'finance_officer',
  HROfficer = 'hr_officer',
  Admissions = 'admissions',
  Viewer = 'viewer',
}

// Each permission is a string in the form "resource:action"
export type Permission =
  // Dashboard
  | 'dashboard:view'
  // Institution
  | 'institution:view'
  | 'institution:manage'
  // Governance
  | 'governance:view'
  | 'governance:manage'
  // Documents
  | 'documents:view'
  | 'documents:manage'
  // HR / Staff
  | 'hr:view'
  | 'hr:manage'
  // Teaching
  | 'teaching:view'
  | 'teaching:manage'
  // Finance
  | 'finance:view'
  | 'finance:manage'
  // Procurement
  | 'procurement:view'
  | 'procurement:manage'
  // Campus
  | 'campus:view'
  | 'campus:manage'
  // Admissions
  | 'admissions:view'
  | 'admissions:manage'
  // Students
  | 'students:view'
  | 'students:manage'
  // Academics / Curriculum
  | 'academics:view'
  | 'academics:manage'
  // Assessments
  | 'assessments:view'
  | 'assessments:manage'
  // Behaviour
  | 'behaviour:view'
  | 'behaviour:manage'
  // Analytics
  | 'analytics:view'
  // Apps / Marketplace
  | 'apps:view'
  | 'apps:manage'
  // Report Templates
  | 'report-templates:view'
  | 'report-templates:manage'
  // Early Years
  | 'early-years:view'
  | 'early-years:manage'
  // Super-admin platform management
  | 'super_admin:view';

// Map each role to the set of permissions it has
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [UserRole.SuperAdmin]: [
    'dashboard:view',
    'institution:view', 'institution:manage',
    'governance:view', 'governance:manage',
    'documents:view', 'documents:manage',
    'hr:view', 'hr:manage',
    'teaching:view', 'teaching:manage',
    'finance:view', 'finance:manage',
    'procurement:view', 'procurement:manage',
    'campus:view', 'campus:manage',
    'admissions:view', 'admissions:manage',
    'students:view', 'students:manage',
    'academics:view', 'academics:manage',
    'assessments:view', 'assessments:manage',
    'behaviour:view', 'behaviour:manage',
    'analytics:view',
    'apps:view', 'apps:manage',
    'report-templates:view', 'report-templates:manage',
    'early-years:view', 'early-years:manage',
    'super_admin:view',
  ],
  // 'institution_owner' is the role every school gets on signup — both
  // via self-service onboarding (OnboardingService.register) and via
  // Super Admin's CRM lead activation. It's not part of the UserRole
  // enum above, but ROLE_PERMISSIONS accepts any string key, and this
  // was previously MISSING entirely — meaning roleHasPermission()
  // returned false for every single permission check for every school
  // that ever signed up, silently blocking every module page with a
  // 403 the moment anyone actually logged into the frontend UI (as
  // opposed to testing the backend directly via curl, which is how
  // this went unnoticed through extensive prior QA). Full owner-level
  // access, matching Admin.
  institution_owner: [
    'dashboard:view',
    'institution:view', 'institution:manage',
    'governance:view', 'governance:manage',
    'documents:view', 'documents:manage',
    'hr:view', 'hr:manage',
    'teaching:view', 'teaching:manage',
    'finance:view', 'finance:manage',
    'procurement:view', 'procurement:manage',
    'campus:view', 'campus:manage',
    'admissions:view', 'admissions:manage',
    'students:view', 'students:manage',
    'academics:view', 'academics:manage',
    'assessments:view', 'assessments:manage',
    'behaviour:view', 'behaviour:manage',
    'analytics:view',
    'apps:view', 'apps:manage',
    'report-templates:view', 'report-templates:manage',
    'early-years:view', 'early-years:manage',
  ],
  [UserRole.Admin]: [
    'dashboard:view',
    'institution:view', 'institution:manage',
    'governance:view', 'governance:manage',
    'documents:view', 'documents:manage',
    'hr:view', 'hr:manage',
    'teaching:view', 'teaching:manage',
    'finance:view', 'finance:manage',
    'procurement:view', 'procurement:manage',
    'campus:view', 'campus:manage',
    'admissions:view', 'admissions:manage',
    'students:view', 'students:manage',
    'academics:view', 'academics:manage',
    'assessments:view', 'assessments:manage',
    'behaviour:view', 'behaviour:manage',
    'analytics:view',
    'apps:view', 'apps:manage',
    'report-templates:view', 'report-templates:manage',
    'early-years:view', 'early-years:manage',
  ],
  [UserRole.Principal]: [
    'dashboard:view',
    'institution:view',
    'governance:view',
    'documents:view',
    'hr:view',
    'teaching:view', 'teaching:manage',
    'finance:view',
    'campus:view',
    'admissions:view', 'admissions:manage',
    'students:view', 'students:manage',
    'academics:view', 'academics:manage',
    'assessments:view', 'assessments:manage',
    'behaviour:view', 'behaviour:manage',
    'analytics:view',
    'apps:view',
    'report-templates:view',
    'early-years:view',
  ],
  [UserRole.Teacher]: [
    'dashboard:view',
    'teaching:view',
    'students:view',
    'academics:view',
    'assessments:view', 'assessments:manage',
    'behaviour:view', 'behaviour:manage',
    'early-years:view', 'early-years:manage',
    'apps:view',
  ],
  [UserRole.FinanceOfficer]: [
    'dashboard:view',
    'finance:view', 'finance:manage',
    'procurement:view', 'procurement:manage',
    'apps:view',
    'report-templates:view', 'report-templates:manage',
  ],
  [UserRole.HROfficer]: [
    'dashboard:view',
    'hr:view', 'hr:manage',
    'teaching:view',
    'apps:view',
  ],
  [UserRole.Admissions]: [
    'dashboard:view',
    'admissions:view', 'admissions:manage',
    'students:view',
    'apps:view',
  ],
  [UserRole.Student]: [
    'dashboard:view',
    'academics:view',
    'assessments:view',
    'behaviour:view',
  ],
  [UserRole.Parent]: [
    'dashboard:view',
    'students:view',
    'assessments:view',
    'behaviour:view',
  ],
  [UserRole.Viewer]: [
    'dashboard:view',
  ],
};

/**
 * Returns true if the given role has the given permission.
 * Unknown/unrecognized roles are denied by default (secure default —
 * do not change this to an allow-by-default fallback).
 */
export function roleHasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) {
    // Unknown role — deny by default
    return false;
  }
  return perms.includes(permission);
}
