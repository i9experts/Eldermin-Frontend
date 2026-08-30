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
  ViewLeadModal,
  ConvertLeadModal,
  AddApplicantModal,
  ViewApplicantModal,
  ScheduleTestModal,
  ScheduleInterviewModal,
  ProcessEnrollmentModal,
  GenerateReportModal,
} from './modals';

// ── Tab Config ────────────────────────────────────────────────
const TABS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview & analytics',
    badge: null,
  },
  {
    key: 'leads',
    label: 'Leads',
    icon: Users,
    description: 'Prospective students',
    badge: '5',
  },
  {
    key: 'applicants',
    label: 'Applicants',
    icon: FileText,
    description: 'Application pipeline',
    badge: '3',
  },
  {
    key: 'evaluation',
    label: 'Evaluation',
    icon: ClipboardList,
    description: 'Tests & interviews',
    badge: '2',
  },
  {
    key: 'enrollment',
    label: 'Enrollment',
    icon: UserCheck,
    description: 'Enrollment processing',
    badge: null,
  },
  {
    key: 'retention',
    label: 'Retention',
    icon: RefreshCw,
    description: 'Re-enrollment & at-risk',
    badge: '1',
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart2,
    description: 'Analytics & export',
    badge: null,
  },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Default Modal State ───────────────────────────────────────
const DEFAULT_MODAL: ModalState = {
  addLead: false,
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

  // ── Modal Handlers ──────────────────────────────────────────
  const openModal = (key: string, data?: any) => {
    // Reset all, open the right one
    const next: ModalState = { ...DEFAULT_MODAL };
    switch (key) {
      case 'addLead': next.addLead = true; break;
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
            tabs={TABS.map(tab => ({ id: tab.key, label: tab.label, icon: tab.icon, count: tab.badge ?? undefined }))}
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
    </div>
  );
};

export default AdmissionLifecycle;
