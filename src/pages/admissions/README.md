# Admission Lifecycle Module — Integration Guide
## Eldermin ERP | Education Operating System

---

## File Structure

```
src/pages/admissions/
├── types.ts                          ← All TypeScript interfaces & types
├── constants.ts                      ← Option lists, seed data, chart data
├── index.tsx                         ← Main entry point (AdmissionLifecycle component)
├── AdmissionDashboard.tsx            ← Dashboard tab (stats, charts, alerts)
├── LeadsTab.tsx                      ← Lead management (kanban + table view)
├── ApplicantsTab.tsx                 ← Application pipeline (cards + table)
├── EvaluationTab.tsx                 ← Entrance tests & interviews
├── EnrollmentRetentionReports.tsx    ← Enrollment, Retention, Reports tabs
└── modals.tsx                        ← All modal dialogs
```

---

## Step 1 — Copy Files to VPS

Via WinSCP, copy the entire `admissions/` folder to:

```
/root/eduos-frontend/src/pages/admissions/
```

---

## Step 2 — Add Route in App.tsx / Router

In your main router file (likely `src/App.tsx` or `src/router.tsx`):

```tsx
import AdmissionLifecycle from './pages/admissions/index';

// Inside your <Routes>:
<Route path="/admissions" element={<AdmissionLifecycle />} />
```

---

## Step 3 — Add Sidebar Link

In your sidebar navigation component, add under the **Admissions** group:

```tsx
{
  path: '/admissions',
  label: 'Admission Life Cycle',
  icon: BookOpen,         // from lucide-react
  group: 'Admissions',
}
```

---

## Step 4 — Install Dependencies (if not already installed)

```bash
cd /root/eduos-frontend
npm install recharts lucide-react
```

Recharts and lucide-react are already used in other modules, so this should be a no-op.

---

## Step 5 — Verify Build

```bash
cd /root/eduos-frontend
npm run build
```

If TypeScript errors appear, they will be in specific files — fix type imports first.

---

## Module Tabs

| Tab         | Key           | Features                                          |
|-------------|---------------|---------------------------------------------------|
| Dashboard   | `dashboard`   | Stats, funnel, trend charts, alerts, recent activity |
| Leads       | `leads`       | Kanban + table, priority, follow-up, convert to applicant |
| Applicants  | `applicants`  | Stage pipeline, document tracking, status management |
| Evaluation  | `evaluation`  | Entrance tests, interviews, scores, recommendations |
| Enrollment  | `enrollment`  | Fee confirmation, class assignment, checklist       |
| Retention   | `retention`   | At-risk tracking, re-enrollment, withdrawal cases   |
| Reports     | `reports`     | Conversion funnel, source analysis, grade demand    |

---

## Modals Included

- ✅ Add Lead
- ✅ View Lead (with convert action)
- ✅ Convert Lead → Applicant
- ✅ New Application Form (4-step wizard)
- ✅ View Applicant (info, documents, timeline tabs)
- ✅ Schedule Entrance Test
- ✅ Schedule Interview
- ✅ Process Enrollment (fee + class + checklist)
- ✅ Generate & Export Report

---

## Integration with Other Modules

| This Module Uses            | From Module          |
|-----------------------------|----------------------|
| Student ID creation         | Student Profile       |
| Fee collection trigger      | Financial Module      |
| Document upload workflow    | Documents & Workflow  |
| Class/section assignment    | Timetable Intelligence|
| Staff/examiner assignment   | HR / Teaching Mgmt    |
| Compliance checks           | Compliance & Governance|

---

## Color Reference

| Color         | Hex       | Usage                              |
|---------------|-----------|------------------------------------|
| Primary Navy  | `#1e3a5f` | Header, buttons, active tabs       |
| Emerald       | `#10b981` | Success, enrolled, verified        |
| Amber         | `#f59e0b` | Pending, follow-up, at-risk        |
| Red           | `#ef4444` | Rejected, critical, withdrawn      |
| Purple        | `#8b5cf6` | Under review, interview            |
| Blue          | `#3b82f6` | New, submitted, scheduled          |

---

## Next Steps

After this module is live, the recommended build order is:

1. ✅ Admission Lifecycle (this module)
2. 🔜 Curriculum Intelligence
3. 🔜 Syllabus Coverage
4. 🔜 Timetable Intelligence
5. 🔜 Library Management
6. 🔜 Student Profile (Student 360)
7. 🔜 Assessment Module
8. 🔜 Behaviour Management
9. 🔜 Analytics & Intelligence
