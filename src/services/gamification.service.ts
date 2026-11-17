import api from '../lib/api';

// LMS Phase 5: a thin client for the gamification module (points, badges,
// leaderboard) - see eldermin-backend's src/gamification/. Staff-facing
// routes only; the student/parent's own view lives in the separate
// Parent Portal app against /parent-portal/students/:id/gamification/*.
export interface GamificationBadge {
  key: string;
  label: string;
  description: string;
  icon: string;
  awardedAt: string;
}

export interface GamificationSummary {
  totalPoints: number;
  badges: GamificationBadge[];
}

export interface LeaderboardRow {
  rank: number;
  studentId: string;
  studentName: string;
  currentGrade?: string;
  currentSection?: string;
  totalPoints: number;
}

export const fetchLeaderboard = (filters: { grade?: string; section?: string; limit?: number } = {}) =>
  api.get<LeaderboardRow[]>('/gamification/leaderboard', { params: filters }).then((r) => r.data);

export const fetchStudentGamificationSummary = (studentId: string) =>
  api.get<GamificationSummary>(`/gamification/students/${studentId}/summary`).then((r) => r.data);

export const awardManualPoints = (studentId: string, points: number, reason: string) =>
  api.post(`/gamification/students/${studentId}/award`, { points, reason }).then((r) => r.data);
