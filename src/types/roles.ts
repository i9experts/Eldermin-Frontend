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
  // Self-service leave ("My Leave") — narrowly scoped: lets a staff member
  // (e.g. Teacher) view/apply for their OWN leave only. Deliberately
  // separate from hr:view, which exposes the full HR admin console.
  | 'leave:self'
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
    // "My Leave" self-service page — NOT hr:view, so Teacher still cannot
    // reach the HR admin console (payroll, other staff records, etc.).
    'leave:self',
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

/**
 * Sub-module-aware permission check for a school-defined custom role's flat
 * `permissions` array (RolesService.toPermissions on the backend — see
 * module-access.util.ts's resolveAccessLevel, which this mirrors).
 *
 * `permission` is still a plain "moduleKey:level" string (e.g.
 * 'finance:manage'); pass `subModuleKey` to check that specific sub-module
 * first ('finance:payable:manage'), falling back to the module-wide grant
 * ('finance:manage') exactly like the backend's CustomRoleGuard does — so a
 * role scoped to "Payables: Manage" only is never shown a Finance tab (or
 * button) the backend would actually 403 on, and never hidden from one it
 * would actually allow.
 *
 * Without a subModuleKey, this also treats ANY granular grant under that
 * module (e.g. 'finance:payable:view') as satisfying the module's bare
 * 'view' check — otherwise a role with ONLY sub-module grants (no
 * module-wide entry) would have the module's nav link hidden entirely,
 * even though it should be reachable for its permitted sub-module(s).
 */
export function hasSubModulePermission(
  permissions: string[] | undefined | null,
  role: string | undefined | null,
  permission: Permission,
  subModuleKey?: string,
): boolean {
  if (!permissions) {
    // Standard enum roles have no sub-module concept — module-wide only.
    return roleHasPermission(role, permission);
  }
  const [moduleKey, level] = permission.split(':') as [string, string];
  if (subModuleKey) {
    if (permissions.includes(`${moduleKey}:${subModuleKey}:${level}`)) return true;
    // 'manage' implies 'view', same convention as everywhere else here.
    if (level === 'view' && permissions.includes(`${moduleKey}:${subModuleKey}:manage`)) return true;
    return permissions.includes(permission);
  }
  if (permissions.includes(permission)) return true;
  const granularPrefix = `${moduleKey}:`;
  return permissions.some(p => {
    if (!p.startsWith(granularPrefix)) return false;
    const parts = p.split(':');
    if (parts.length !== 3) return false; // only 3-part = sub-module grants
    const grantedLevel = parts[2];
    return level === 'view' ? (grantedLevel === 'view' || grantedLevel === 'manage') : grantedLevel === 'manage';
  });
}
