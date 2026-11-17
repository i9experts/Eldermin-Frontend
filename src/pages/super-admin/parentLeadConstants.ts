// Mirrors PARENT_LEAD_GRADES in eldermin-backend's parent-lead.schema.ts -
// a fixed, school-agnostic grade ladder since a parent lead has no real
// Institution/Classes & Sections record to pull a grade list from (unlike
// GradeLevelDropdown elsewhere, which reads real per-school data).
export const PARENT_LEAD_GRADES = [
  'Playgroup', 'Nursery', 'KG',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12',
] as const;
