import React from 'react';
import {
  GraduationCap, MapPin, Users, Layers3, BookOpen, Phone,
  Package, CreditCard, Plug, CalendarClock, ShieldCheck, ShieldAlert, PenLine,
  Megaphone, MessageSquare,
} from 'lucide-react';

// ============================================================
// ONBOARDING WIZARD SNAPSHOT
// Everything a school submitted through eldermin.com/wizard, rendered as
// one place to look instead of scattered raw fields. Shared between the
// CRM's Lead detail modal (the submission itself) and the Institution
// detail modal (what a now-live school originally asked for) so both
// surfaces present identical, complete data — nothing wizard-side gets
// silently dropped on either end.
// ============================================================

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-start gap-2.5">
    <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/5 text-[#1e3a5f] flex items-center justify-center flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-gray-800 truncate">{value ?? '—'}</p>
    </div>
  </div>
);

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
    {icon}{children}
  </p>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[11px] bg-[#1e3a5f]/5 text-[#1e3a5f] px-2.5 py-1 rounded-lg border border-[#1e3a5f]/10 font-medium">
    {children}
  </span>
);

export const OnboardingSnapshot: React.FC<{ lead: any }> = ({ lead }) => {
  if (!lead) return null;

  const hasSize = lead.studentCount || lead.staffCount || lead.classCount || lead.gradeRange;
  const hasTraining = lead.preferredTrainingDate || lead.preferredTrainingTime || lead.trainingMode;
  const hasConsent = lead.termsAccepted || lead.dataPolicyAccepted || lead.signature;
  const hasCampaign = lead.utmSource || lead.utmMedium || lead.utmCampaign || lead.utmContent || lead.utmTerm;

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel icon={<GraduationCap size={12} />}>School & Administrator</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatTile icon={<GraduationCap size={14} />} label="School Type" value={lead.schoolType} />
          <StatTile icon={<MapPin size={14} />} label="Location" value={[lead.city, lead.country].filter(Boolean).join(', ') || undefined} />
          <StatTile icon={<Phone size={14} />} label="Admin Phone" value={lead.adminPhone} />
          <StatTile icon={<Users size={14} />} label="Admin Role" value={lead.adminRole} />
        </div>
      </div>

      {hasSize && (
        <div>
          <SectionLabel icon={<Layers3 size={12} />}>School Size</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile icon={<Users size={14} />} label="Students" value={lead.studentCount} />
            <StatTile icon={<Users size={14} />} label="Staff" value={lead.staffCount} />
            <StatTile icon={<Layers3 size={14} />} label="Classes" value={lead.classCount} />
            <StatTile icon={<BookOpen size={14} />} label="Grade Range" value={lead.gradeRange} />
          </div>
        </div>
      )}

      <div>
        <SectionLabel icon={<CreditCard size={12} />}>Plan & Billing</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <StatTile icon={<CreditCard size={14} />} label="Plan Requested" value={lead.planRequested} />
          <StatTile icon={<CreditCard size={14} />} label="Billing Cycle" value={lead.billingCycle} />
        </div>
      </div>

      {lead.modulesRequested?.length > 0 && (
        <div>
          <SectionLabel icon={<Package size={12} />}>Modules Requested ({lead.modulesRequested.length})</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {lead.modulesRequested.map((m: string) => <Chip key={m}>{m}</Chip>)}
          </div>
        </div>
      )}

      {lead.integrationsRequested?.length > 0 && (
        <div>
          <SectionLabel icon={<Plug size={12} />}>Integrations Requested</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {lead.integrationsRequested.map((i: string) => <Chip key={i}>{i}</Chip>)}
          </div>
        </div>
      )}

      {hasTraining && (
        <div>
          <SectionLabel icon={<CalendarClock size={12} />}>Training Preference</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <StatTile icon={<CalendarClock size={14} />} label="Date" value={lead.preferredTrainingDate} />
            <StatTile icon={<CalendarClock size={14} />} label="Time" value={lead.preferredTrainingTime} />
            <StatTile icon={<CalendarClock size={14} />} label="Mode" value={lead.trainingMode} />
          </div>
        </div>
      )}

      {hasCampaign && (
        <div>
          <SectionLabel icon={<Megaphone size={12} />}>Campaign Attribution</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {lead.utmSource && <Chip>source: {lead.utmSource}</Chip>}
            {lead.utmMedium && <Chip>medium: {lead.utmMedium}</Chip>}
            {lead.utmCampaign && <Chip>campaign: {lead.utmCampaign}</Chip>}
            {lead.utmContent && <Chip>content: {lead.utmContent}</Chip>}
            {lead.utmTerm && <Chip>term: {lead.utmTerm}</Chip>}
          </div>
        </div>
      )}

      {(lead.inquiryType || lead.message) && (
        <div>
          <SectionLabel icon={<MessageSquare size={12} />}>{lead.inquiryType ? `Inquiry — ${lead.inquiryType}` : 'Message'}</SectionLabel>
          {lead.message && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{lead.message}</p>}
        </div>
      )}

      {hasConsent && (
        <div>
          <SectionLabel icon={<ShieldCheck size={12} />}>Legal Consent & Signature</SectionLabel>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              {lead.termsAccepted ? <ShieldCheck size={14} className="text-emerald-600" /> : <ShieldAlert size={14} className="text-amber-500" />}
              <span className={lead.termsAccepted ? 'text-gray-700' : 'text-amber-600'}>
                Terms of Service {lead.termsAccepted ? 'accepted' : 'not accepted'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lead.dataPolicyAccepted ? <ShieldCheck size={14} className="text-emerald-600" /> : <ShieldAlert size={14} className="text-amber-500" />}
              <span className={lead.dataPolicyAccepted ? 'text-gray-700' : 'text-amber-600'}>
                Data Processing Policy {lead.dataPolicyAccepted ? 'accepted' : 'not accepted'}
              </span>
            </div>
            {lead.signature && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-200 mt-2">
                <PenLine size={14} className="text-gray-400" />
                <span className="italic font-serif text-gray-700">{lead.signature}</span>
                {lead.consentedAt && <span className="text-gray-400 ml-auto">{new Date(lead.consentedAt).toLocaleString()}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
