// ============================================================
// ADMISSION LIFECYCLE MODULE — INDEX (Entry Point)
// Eldermin ERP | Education Operating System
// ============================================================

import React, { useState } from 'react';
import {
  Users, FileText, ClipboardList, UserCheck, RefreshCw,
  BarChart2, Home, Settings,
  Filter, Download, Search, BookOpen, TrendingUp,
  CheckSquare, AlertTriangle,
} from 'lucide-react';
import { Lead, Applicant, Enrollment, RetentionRecord, ModalState, ModalKey } from './types';
import { ModuleHeader } from '../../components/layout/ModuleHeader';
import { TabBar } from '../../components/layout/TabBar';

import AdmissionDashboard from './AdmissionDashboard';
import LeadsTab from './LeadsTab';
import ApplicantsTab from './ApplicantsTab';
import EvaluationTab from './EvaluationTab';
import { EnrollmentTab, RetentionTab, ReportsTab } from './EnrollmentRetentionReports';

import {
  AddLeadModal,
  EditLeadModal,
  ViewLeadModal,
  ConvertLeadModal,
  AddApplicantModal,
  ViewApplicantModal,
  ScheduleTestModal,
  ScheduleInterviewModal,
  ProcessEnrollmentModal,
  GenerateReportModal,
  ShareableLinkModal,
} from './modals';
import { useLeadStats, useAdmissionDashboard } from '../../hooks/useAdmissions';

// ── Tab Config ────────────────────────────────────────────────
// Static scaffolding (labels/icons/descriptions never change at runtime);
// badge counts are computed live in the component from real data below -
// see useTabBadges. Kept as a plain array (not state) since only the
// badge values vary.
const TAB_META = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, description: 'Overview & analytics' },
  { key: 'leads', label: 'Leads', icon: Users, description: 'Prospective students' },
  { key: 'applicants', label: 'Applicants', icon: FileText, description: 'Application pipeline' },
  { key: 'evaluation', label: 'Evaluation', icon: ClipboardList, description: 'Tests & interviews' },
  { key: 'enrollment', label: 'Enrollment', icon: UserCheck, description: 'Enrollment processing' },
  { key: 'retention', label: 'Retention', icon: RefreshCw, description: 'Re-enrollment & at-risk' },
  { key: 'reports', label: 'Reports', icon: BarChart2, description: 'Analytics & export' },
] as const;

type TabKey = typeof TAB_META[number]['key'];

// Real counts, replacing what used to be hardcoded literal strings
// ('5', '3', '2', '1') left over from scaffolding and never wired to any
// query - reuses the existing /leads/stats and /dashboard endpoints
// rather than adding new stats endpoints per tab.
function useTabBadges(): Partial<Record<TabKey, number>> {
  const { data: leadStats } = useLeadStats();
  const { data: dashboard } = useAdmissionDashboard();
  const stats = dashboard?.stats;

  const leadsTotal = leadStats
    ? Object.values(leadStats as Record<string, number>).reduce((sum, n) => sum + (n || 0), 0)
    : undefined;

  return {
    leads: leadsTotal,
    applicants: stats?.totalApplications,
    evaluation: stats ? (stats.testsScheduled || 0) + (stats.interviewsScheduled || 0) : undefined,
    retention: stats?.atRiskRetention,
  };
}

// ── Default Modal State ───────────────────────────────────────
const DEFAULT_MODAL: ModalState = {
  addLead: false,
  editLead: false,
  viewLead: false,
  convertLead: false,
  addApplicant: false,
  viewApplicant: false,
  scheduleTest: false,
  scheduleInterview: false,
  viewEvaluation: false,
  processEnrollment: false,
  viewEnrollment: false,
  viewRetention: false,
  generateReport: false,
  shareableLink: false,
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const AdmissionLifecycle: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [modals, setModals] = useState<ModalState>(DEFAULT_MODAL);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedRetention, setSelectedRetention] = useState<RetentionRecord | null>(null);
  const tabBadges = useTabBadges();

  // ── Modal Handlers ──────────────────────────────────────────
  const openModal = (key: string, data?: any) => {
    // Reset all, open the right one
    const next: ModalState = { ...DEFAULT_MODAL };
    switch (key) {
      case 'addLead': next.addLead = true; break;
      case 'editLead': next.editLead = true; setSelectedLead(data); break;
      case 'viewLead': next.viewLead = true; setSelectedLead(data); break;
      case 'convertLead': next.convertLead = true; setSelectedLead(data); break;
      case 'addApplicant': next.addApplicant = true; break;
      case 'viewApplicant': next.viewApplicant = true; setSelectedApplicant(data); break;
      case 'scheduleTest': next.scheduleTest = true; break;
      case 'scheduleInterview': next.scheduleInterview = true; break;
      case 'viewEvaluation': next.viewEvaluation = true; break;
      case 'processEnrollment': next.processEnrollment = true; setSelectedApplicant(data); break;
      case 'viewEnrollment': next.viewEnrollment = true; setSelectedEnrollment(data); break;
      case 'viewRetention': next.viewRetention = true; setSelectedRetention(data); break;
      case 'generateReport': next.generateReport = true; break;
      case 'shareableLink': next.shareableLink = true; break;
    }
    setModals(next);
  };

  const closeAllModals = () => {
    setModals(DEFAULT_MODAL);
    setSelectedLead(null);
    setSelectedApplicant(null);
  };

  // ── Render Tab Content ──────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <AdmissionDashboard />;
      case 'leads': return <LeadsTab onOpenModal={openModal} />;
      case 'applicants': return <ApplicantsTab onOpenModal={openModal} />;
      case 'evaluation': return <EvaluationTab onOpenModal={openModal} />;
      case 'enrollment': return <EnrollmentTab onOpenModal={openModal} />;
      case 'retention': return <RetentionTab onOpenModal={openModal} />;
      case 'reports': return <ReportsTab onOpenModal={openModal} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* ── Module Header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <ModuleHeader
          icon={BookOpen}
          title="Admission Lifecycle"
          subtitle="Leads, applications, evaluation, enrollment and retention tracking"
        />

        {/* Tab Navigation */}
        <div className="px-6">
          <TabBar
            tabs={TAB_META.map(tab => ({
              id: tab.key,
              label: tab.label,
              icon: tab.icon,
              count: tabBadges[tab.key] ? String(tabBadges[tab.key]) : undefined,
            }))}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as TabKey)}
          />
        </div>
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderTab()}
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {modals.addLead && <AddLeadModal onClose={closeAllModals} />}

      {modals.editLead && selectedLead && (
        <EditLeadModal lead={selectedLead} onClose={closeAllModals} />
      )}

      {modals.viewLead && selectedLead && (
        <ViewLeadModal
          lead={selectedLead}
          onClose={closeAllModals}
          onConvert={() => openModal('convertLead', selectedLead)}
        />
      )}

      {modals.convertLead && selectedLead && (
        <ConvertLeadModal lead={selectedLead} onClose={closeAllModals} />
      )}

      {modals.addApplicant && <AddApplicantModal onClose={closeAllModals} />}

      {modals.viewApplicant && selectedApplicant && (
        <ViewApplicantModal
          applicant={selectedApplicant}
          onClose={closeAllModals}
          onScheduleTest={() => openModal('scheduleTest')}
          onEnroll={() => openModal('processEnrollment', selectedApplicant)}
        />
      )}

      {modals.scheduleTest && <ScheduleTestModal onClose={closeAllModals} />}
      {modals.scheduleInterview && <ScheduleInterviewModal onClose={closeAllModals} />}

      {modals.processEnrollment && (
        <ProcessEnrollmentModal applicant={selectedApplicant || undefined} onClose={closeAllModals} />
      )}

      {modals.generateReport && <GenerateReportModal onClose={closeAllModals} />}
      {modals.shareableLink && <ShareableLinkModal onClose={closeAllModals} />}
    </div>
  );
};

export default AdmissionLifecycle;
