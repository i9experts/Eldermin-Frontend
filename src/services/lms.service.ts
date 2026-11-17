import api from '../lib/api';

// Phase 0 LMS unification: a thin read-only client for the new backend
// aggregator (src/lms/ in eldermin-backend) that composes Syllabus (course
// content), Teaching (assignments), Assessments (self-paced quizzes) and
// Certificates (course-completion certs) into one overview - no new data,
// just one call instead of stitching four dashboards together client-side.
export const fetchLmsOverview = (academicYear?: string) =>
  api.get('/lms/overview', { params: { academicYear } }).then(r => r.data);
