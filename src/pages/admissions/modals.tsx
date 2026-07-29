// ============================================================
// ADMISSION LIFECYCLE — ALL MODALS
// Eldermin ERP | Education Operating System
// ============================================================

import React, { useState } from 'react';
import {
  X, User, Phone, Mail, MapPin, GraduationCap, Calendar,
  FileText, CheckCircle, AlertCircle, Upload, Plus, Trash2,
  CreditCard, BookOpen, Star, Clock, Building, Users,
  ChevronRight, Download, Printer, Save, Send,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useCreateLead, useCreateApplicant, useUpdateDocument,
  useCreateTest, useCreateInterview, useCreateEnrollment,
  useApplicants,
} from '../../hooks/useAdmissions';
import { Lead, Applicant, EntranceTest, Interview, Enrollment, RetentionRecord } from './types';
import {
  LEAD_SOURCES, LEAD_STATUSES, APPLICATION_STATUSES, GRADES, PRIORITY_COLORS,
} from './constants';
import { StaffSelect } from '../../components/ui/StaffSelect';
import { useStaffList } from '../../hooks/useStaffList';

// ── Modal Wrapper ─────────────────────────────────────────────
interface ModalWrapperProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, subtitle, onClose, children, size = 'lg', footer }) => {
  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClass} max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {/* Footer */}
        {footer && <div className="border-t border-gray-100 p-4 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// ── Form Field ────────────────────────────────────────────────
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; col?: number }> =
  ({ label, required, children, col = 1 }) => (
    <div className={col === 2 ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]/40 text-gray-700 placeholder-gray-400" />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700">
    {children}
  </select>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 text-gray-700 placeholder-gray-400 resize-none" />
);

// ── Section Header ────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-3 mt-2">
    {icon && <div className="text-[#1e3a5f]">{icon}</div>}
    <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">{title}</h3>
    <div className="flex-1 h-px bg-gray-100" />
  </div>
);

// ── Button helpers ────────────────────────────────────────────
const BtnPrimary: React.FC<{ onClick?: () => void; children: React.ReactNode; icon?: React.ReactNode }> =
  ({ onClick, children, icon }) => (
    <button onClick={onClick}
      className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-5 py-2.5 rounded-lg hover:bg-[#16304f] transition-colors font-medium">
      {icon}{children}
    </button>
  );
const BtnSecondary: React.FC<{ onClick?: () => void; children: React.ReactNode }> =
  ({ onClick, children }) => (
    <button onClick={onClick}
      className="text-xs border border-gray-200 px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium">
      {children}
    </button>
  );

// ============================================================
// ADD LEAD MODAL
// ============================================================
export const AddLeadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    gradeInterested: '', source: '', priority: 'medium',
    assignedTo: '', campaign: '', followUpDate: '', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const createLead = useCreateLead();

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.gradeInterested || !form.source) {
      toast.error('Please fill in all required fields');
      return;
    }
    createLead.mutate(
      { ...form, tags: [] },
      {
        onSuccess: () => { toast.success('Lead created'); onClose(); },
        onError:   () => toast.error('Failed to create lead'),
      },
    );
  };

  return (
    <ModalWrapper title="Add New Lead" subtitle="Capture a prospective student inquiry" onClose={onClose}
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} icon={<Save size={12} />}>{createLead.isPending ? 'Saving…' : 'Save Lead'}</BtnPrimary></>}>
      <div className="space-y-4">
        <SectionHeader title="Personal Information" icon={<User size={14} />} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" required><Input placeholder="First name" value={form.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
          <Field label="Last Name" required><Input placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
          <Field label="Email Address"><Input type="email" placeholder="guardian@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Phone Number" required><Input placeholder="+92 300 0000000" value={form.phone} onChange={e => set('phone', e.target.value)} /></Field>
        </div>

        <SectionHeader title="Inquiry Details" icon={<GraduationCap size={14} />} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grade Interested" required>
            <Select value={form.gradeInterested} onChange={e => set('gradeInterested', e.target.value)}>
              <option value="">Select Grade</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Lead Source" required>
            <Select value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="">Select Source</option>
              {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={e => set('priority', e.target.value)}>
              {['low', 'medium', 'high', 'urgent'].map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Campaign">
            <Input placeholder="e.g. Spring Admissions 2025" value={form.campaign} onChange={e => set('campaign', e.target.value)} />
          </Field>
          <Field label="Assign To">
            <StaffSelect value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} />
          </Field>
          <Field label="Follow-up Date">
            <Input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
          </Field>
        </div>

        <Field label="Notes" col={2}>
          <Textarea rows={3} placeholder="Any additional notes about this lead..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// VIEW LEAD MODAL
// ============================================================
export const ViewLeadModal: React.FC<{ lead: Lead; onClose: () => void; onConvert: () => void }> = ({ lead, onClose, onConvert }) => {
  const statusCfg = LEAD_STATUSES.find(s => s.value === lead.status);
  return (
    <ModalWrapper title={`${lead.firstName} ${lead.lastName}`} subtitle={`Lead ID: ${lead.id}`} onClose={onClose} size="lg"
      footer={
        <>
          <BtnSecondary onClick={onClose}>Close</BtnSecondary>
          {lead.status !== 'converted' && lead.status !== 'lost' && (
            <BtnPrimary onClick={onConvert} icon={<ChevronRight size={12} />}>Convert to Applicant</BtnPrimary>
          )}
        </>
      }>
      <div className="space-y-4">
        {/* Status banner */}
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${statusCfg?.color || 'bg-gray-100'}`}>
          <span className="text-xs font-semibold">{statusCfg?.label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${PRIORITY_COLORS[lead.priority]}`}>{lead.priority} priority</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <SectionHeader title="Contact" icon={<Phone size={13} />} />
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-600"><Phone size={12} className="text-gray-400" />{lead.phone}</div>
              <div className="flex items-center gap-2 text-gray-600"><Mail size={12} className="text-gray-400" />{lead.email}</div>
            </div>
          </div>
          <div className="space-y-3">
            <SectionHeader title="Inquiry" icon={<GraduationCap size={13} />} />
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="text-gray-400">Grade:</span> {lead.gradeInterested}</p>
              <p><span className="text-gray-400">Source:</span> {lead.source.replace('_', ' ')}</p>
              <p><span className="text-gray-400">Campaign:</span> {lead.campaign || '—'}</p>
              <p><span className="text-gray-400">Campus:</span> {lead.campusPreference || '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SectionHeader title="Assignment" icon={<User size={13} />} />
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="text-gray-400">Assigned To:</span> {lead.assignedTo}</p>
              <p><span className="text-gray-400">Created:</span> {lead.createdAt}</p>
              <p><span className="text-gray-400">Last Contact:</span> {lead.lastContactedAt || '—'}</p>
              <p><span className="text-gray-400">Follow Up:</span> {lead.followUpDate}</p>
            </div>
          </div>
          <div>
            <SectionHeader title="Tags" />
            <div className="flex flex-wrap gap-1">
              {lead.tags.map(tag => (
                <span key={tag} className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded">#{tag}</span>
              ))}
              {lead.tags.length === 0 && <span className="text-xs text-gray-400">No tags</span>}
            </div>
          </div>
        </div>

        {lead.notes && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 font-medium mb-1">NOTES</p>
            <p className="text-xs text-gray-700">{lead.notes}</p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// CONVERT LEAD TO APPLICANT MODAL
// ============================================================
export const ConvertLeadModal: React.FC<{ lead: Lead; onClose: () => void }> = ({ lead, onClose }) => (
  <ModalWrapper title="Convert Lead to Applicant" subtitle={`Converting: ${lead.firstName} ${lead.lastName}`} onClose={onClose} size="md"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<CheckCircle size={12} />}>Create Application</BtnPrimary></>}>
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Converting this lead will create a new application form pre-filled with available information.
          The lead record will be marked as "Converted."
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Academic Year" required>
          <Select defaultValue="2025-26"><option value="2025-26">2025–26</option><option value="2024-25">2024–25</option></Select>
        </Field>
        <Field label="Campus">
          <Select><option>Main Campus</option><option>North Campus</option></Select>
        </Field>
        <Field label="Grade Applied" required>
          <Select defaultValue={lead.gradeInterested}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
        </Field>
        <Field label="Assign To">
          <StaffSelect defaultValue={lead.assignedTo} />
        </Field>
      </div>
      <Field label="Application Notes">
        <Textarea rows={3} defaultValue={lead.notes} placeholder="Initial notes for the application..." />
      </Field>
    </div>
  </ModalWrapper>
);

// ============================================================
// ADD APPLICANT MODAL (Full Form)
// ============================================================
export const AddApplicantModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const stepLabels = ['Student Info', 'Guardian Info', 'Academic Info', 'Documents'];

  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '' as 'male' | 'female' | '',
    nationality: 'Pakistani', religion: 'Islam', address: '', city: '',
    siblingInSchool: false, specialNeeds: false,
    fatherName: '', motherName: '', guardianPhone: '', guardianEmail: '',
    gradeApplied: '', academicYear: '2025-26', campusId: 'main',
    previousSchool: '', previousGrade: '', lastGPA: '', notes: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const createApplicant = useCreateApplicant();

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.gradeApplied || !form.previousSchool || !form.guardianPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    createApplicant.mutate(
      { ...form, gender: form.gender || 'male', assignedTo: '' },
      {
        onSuccess: () => { toast.success('Application submitted'); onClose(); },
        onError:   () => toast.error('Failed to submit application'),
      },
    );
  };

  return (
    <ModalWrapper title="New Application Form" subtitle={`Step ${step} of ${totalSteps}: ${stepLabels[step - 1]}`} onClose={onClose} size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < step ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <BtnSecondary onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
              {step === 1 ? 'Cancel' : '← Back'}
            </BtnSecondary>
            <BtnPrimary
              onClick={() => step < totalSteps ? setStep(s => s + 1) : handleSubmit()}
              icon={step === totalSteps ? <Send size={12} /> : <ChevronRight size={12} />}
            >
              {step === totalSteps ? (createApplicant.isPending ? 'Submitting…' : 'Submit Application') : 'Next →'}
            </BtnPrimary>
          </div>
        </div>
      }>
      {step === 1 && (
        <div className="space-y-4">
          <SectionHeader title="Student Personal Information" icon={<User size={14} />} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required><Input placeholder="Student's first name" value={form.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
            <Field label="Last Name" required><Input placeholder="Student's last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
            <Field label="Date of Birth" required><Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></Field>
            <Field label="Gender" required>
              <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
              </Select>
            </Field>
            <Field label="Nationality">
              <Select value={form.nationality} onChange={e => set('nationality', e.target.value)}>
                <option>Pakistani</option><option>Afghan</option><option>British</option><option>Other</option>
              </Select>
            </Field>
            <Field label="Religion">
              <Select value={form.religion} onChange={e => set('religion', e.target.value)}>
                <option>Islam</option><option>Christianity</option><option>Other</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Home Address" required><Input placeholder="Full home address" value={form.address} onChange={e => set('address', e.target.value)} /></Field>
            <Field label="City" required><Input placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} /></Field>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.siblingInSchool} onChange={e => set('siblingInSchool', e.target.checked)} />
              Sibling currently enrolled in school
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.specialNeeds} onChange={e => set('specialNeeds', e.target.checked)} />
              Student has special learning needs
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <SectionHeader title="Father's Information" icon={<Users size={14} />} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Father's Full Name" required><Input placeholder="Father's full name" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} /></Field>
            <Field label="Father's Phone" required><Input placeholder="+92 300 0000000" value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} /></Field>
          </div>
          <SectionHeader title="Mother's Information" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mother's Full Name"><Input placeholder="Mother's full name" value={form.motherName} onChange={e => set('motherName', e.target.value)} /></Field>
          </div>
          <SectionHeader title="Emergency Contact" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary Email" required><Input type="email" placeholder="guardian@email.com" value={form.guardianEmail} onChange={e => set('guardianEmail', e.target.value)} /></Field>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <SectionHeader title="Academic Background" icon={<GraduationCap size={14} />} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade Applying For" required>
              <Select value={form.gradeApplied} onChange={e => set('gradeApplied', e.target.value)}>
                <option value="">Select Grade</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="Academic Year">
              <Select value={form.academicYear} onChange={e => set('academicYear', e.target.value)}>
                <option value="2025-26">2025–26</option>
              </Select>
            </Field>
            <Field label="Previous School" required><Input placeholder="Name of previous school" value={form.previousSchool} onChange={e => set('previousSchool', e.target.value)} /></Field>
            <Field label="Previous Grade/Class"><Input placeholder="e.g. Grade 4, Class IV" value={form.previousGrade} onChange={e => set('previousGrade', e.target.value)} /></Field>
            <Field label="Last Academic Result"><Input placeholder="e.g. A+, 90%, 4.0 GPA" value={form.lastGPA} onChange={e => set('lastGPA', e.target.value)} /></Field>
            <Field label="Campus">
              <Select value={form.campusId} onChange={e => set('campusId', e.target.value)}>
                <option value="main">Main Campus</option><option value="north">North Campus</option>
              </Select>
            </Field>
          </div>
          <Field label="Additional Notes">
            <Textarea rows={3} placeholder="Any awards, achievements, or special academic notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Field>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <SectionHeader title="Required Documents" icon={<FileText size={14} />} />
          <p className="text-xs text-gray-500">Documents can be uploaded and verified by the admissions team after submission.</p>
          {['Birth Certificate (B-Form / NADRA)', 'Previous School Reports (Last 2 years)', 'Character Certificate', 'Passport-size Photos (4 copies)', 'Parent CNIC Copies', 'Transfer Certificate (if applicable)'].map(doc => (
            <div key={doc} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-700">{doc}</span>
              </div>
              <label className="cursor-pointer bg-[#1e3a5f] text-white text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#16304f] transition-colors">
                <Upload size={10} /> Upload
                <input type="file" className="hidden" />
              </label>
            </div>
          ))}
        </div>
      )}
    </ModalWrapper>
  );
};

// ============================================================
// VIEW APPLICANT MODAL
// ============================================================
export const ViewApplicantModal: React.FC<{
  applicant: Applicant;
  onClose: () => void;
  onScheduleTest: () => void;
  onEnroll: () => void;
}> = ({ applicant, onClose, onScheduleTest, onEnroll }) => {
  const [tab, setTab] = useState<'info' | 'docs' | 'timeline'>('info');
  const statusCfg = APPLICATION_STATUSES.find(s => s.value === applicant.status);
  const updateDoc = useUpdateDocument();
  const applicantId = (applicant as any)._id || applicant.id;

  const handleDocAction = (doc: any, status: 'verified' | 'rejected') => {
    const docId = doc._id || doc.id;
    updateDoc.mutate(
      { applicantId, documentId: docId, status },
      {
        onSuccess: () => toast.success(`Document ${status}`),
        onError:   () => toast.error('Failed to update document'),
      },
    );
  };

  return (
    <ModalWrapper title={`${applicant.firstName} ${applicant.lastName}`}
      subtitle={applicant.applicationNumber} onClose={onClose} size="xl"
      footer={
        <>
          <BtnSecondary onClick={onClose}>Close</BtnSecondary>
          {applicant.stage !== 'enrollment' && (
            <BtnSecondary onClick={onScheduleTest}>Schedule Test</BtnSecondary>
          )}
          {applicant.status === 'accepted' && (
            <BtnPrimary onClick={onEnroll} icon={<CheckCircle size={12} />}>Process Enrollment</BtnPrimary>
          )}
        </>
      }>
      {/* Status */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg?.color}`}>{statusCfg?.label}</span>
        <span className="text-xs text-gray-400">{applicant.gradeApplied} · {applicant.campusId} campus · {applicant.academicYear}</span>
        <span className="ml-auto text-xs text-gray-400">Assigned to: {applicant.assignedTo}</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-100 mb-4">
        {(['info', 'docs', 'timeline'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium border-b-2 capitalize transition-all
              ${tab === t ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t === 'docs' ? 'Documents' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <SectionHeader title="Student Details" />
            <div className="space-y-1.5 text-xs text-gray-600">
              <p><span className="text-gray-400 w-24 inline-block">DOB:</span> {applicant.dateOfBirth}</p>
              <p><span className="text-gray-400 w-24 inline-block">Gender:</span> {applicant.gender}</p>
              <p><span className="text-gray-400 w-24 inline-block">Nationality:</span> {applicant.nationality}</p>
              <p><span className="text-gray-400 w-24 inline-block">Address:</span> {applicant.address}, {applicant.city}</p>
              {applicant.specialNeeds && (
                <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2 text-amber-700">
                  Special needs noted: {applicant.specialNeedsDetail}
                </div>
              )}
            </div>
          </div>
          <div>
            <SectionHeader title="Guardian Details" />
            <div className="space-y-1.5 text-xs text-gray-600">
              <p><span className="text-gray-400 w-24 inline-block">Father:</span> {applicant.fatherName}</p>
              <p><span className="text-gray-400 w-24 inline-block">Mother:</span> {applicant.motherName}</p>
              <p><span className="text-gray-400 w-24 inline-block">Phone:</span> {applicant.guardianPhone}</p>
              <p><span className="text-gray-400 w-24 inline-block">Email:</span> {applicant.guardianEmail}</p>
            </div>
          </div>
          <div>
            <SectionHeader title="Academic Background" />
            <div className="space-y-1.5 text-xs text-gray-600">
              <p><span className="text-gray-400 w-24 inline-block">Grade Applied:</span> {applicant.gradeApplied}</p>
              <p><span className="text-gray-400 w-24 inline-block">Prev School:</span> {applicant.previousSchool}</p>
              <p><span className="text-gray-400 w-24 inline-block">Prev Grade:</span> {applicant.previousGrade}</p>
              <p><span className="text-gray-400 w-24 inline-block">Last GPA:</span> {applicant.lastGPA || '—'}</p>
              {applicant.siblingInSchool && (
                <div className="mt-1 text-emerald-600 font-medium">✓ Sibling enrolled in school</div>
              )}
            </div>
          </div>
          <div>
            <SectionHeader title="Notes" />
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">{applicant.notes || 'No notes added yet.'}</p>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="space-y-3">
          {(applicant.documents || []).map((doc, i) => {
            const docId = (doc as any)._id || doc.id || i;
            return (
              <div key={docId} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText size={16} className={doc.status === 'verified' ? 'text-emerald-500' : doc.status === 'rejected' ? 'text-red-500' : 'text-amber-500'} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.type}</p>
                    {doc.verifiedBy && <p className="text-[10px] text-emerald-600">Verified by {doc.verifiedBy}</p>}
                    {doc.remarks && <p className="text-[10px] text-red-500">{doc.remarks}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                    ${doc.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {doc.status}
                  </span>
                  {doc.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleDocAction(doc, 'verified')}
                        disabled={updateDoc.isPending}
                        className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >Verify</button>
                      <button
                        onClick={() => handleDocAction(doc, 'rejected')}
                        disabled={updateDoc.isPending}
                        className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >Reject</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <button className="flex items-center gap-2 text-xs text-[#1e3a5f] font-medium hover:underline mt-2">
            <Plus size={12} /> Add Document
          </button>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-4">
          <div className="relative">
            {[
              { date: applicant.submittedAt, event: 'Application Submitted', detail: 'Online portal', color: 'bg-blue-500' },
              { date: applicant.submittedAt, event: 'Documents Received', detail: 'Partial documents uploaded', color: 'bg-purple-500' },
              { date: applicant.updatedAt, event: 'Status Updated', detail: applicant.status.replace('_', ' '), color: 'bg-amber-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0 mt-1`} />
                  {i < 2 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-semibold text-gray-800">{item.event}</p>
                  <p className="text-[10px] text-gray-400">{item.detail}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

// ============================================================
// SCHEDULE TEST MODAL
// ============================================================
export const ScheduleTestModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: appRes } = useApplicants();
  const applicants = (appRes?.data ?? []) as any[];
  const createTest = useCreateTest();
  const ALL_SUBJECTS = ['English', 'Mathematics', 'Science', 'Urdu', 'General Knowledge', 'Social Studies'];

  const [form, setForm] = useState({
    applicantId: '', applicantName: '', scheduledDate: '', scheduledTime: '',
    venue: '', examiner: '', maxScore: 100, subjects: [] as string[],
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleSubject = (sub: string) =>
    setForm(f => ({ ...f, subjects: f.subjects.includes(sub) ? f.subjects.filter(s => s !== sub) : [...f.subjects, sub] }));

  const handleSave = () => {
    if (!form.applicantId || !form.scheduledDate || !form.scheduledTime || !form.venue) {
      toast.error('Please fill in all required fields'); return;
    }
    createTest.mutate(
      { ...form, schoolSlug: 'demo-school', academicYear: '2025-26' },
      {
        onSuccess: () => { toast.success('Test scheduled'); onClose(); },
        onError:   () => toast.error('Failed to schedule test'),
      },
    );
  };

  return (
    <ModalWrapper title="Schedule Entrance Test" onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} icon={<Calendar size={12} />}>{createTest.isPending ? 'Scheduling…' : 'Schedule Test'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Applicant" required col={2}>
            <Select value={form.applicantId} onChange={e => {
              const app = applicants.find(a => (a._id || a.id) === e.target.value);
              set('applicantId', e.target.value);
              if (app) set('applicantName', `${app.firstName} ${app.lastName}`);
            }}>
              <option value="">Select Applicant</option>
              {applicants.map(a => <option key={(a._id || a.id)} value={(a._id || a.id)}>{a.firstName} {a.lastName} · {a.applicationNumber}</option>)}
            </Select>
          </Field>
          <Field label="Test Date" required><Input type="date" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} /></Field>
          <Field label="Test Time" required><Input type="time" value={form.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} /></Field>
          <Field label="Venue / Hall" required><Input placeholder="e.g. Examination Hall A" value={form.venue} onChange={e => set('venue', e.target.value)} /></Field>
          <Field label="Examiner">
            <StaffSelect value={form.examiner} onChange={e => set('examiner', e.target.value)} placeholder="Assign Examiner" />
          </Field>
          <Field label="Maximum Score"><Input type="number" value={form.maxScore} onChange={e => set('maxScore', Number(e.target.value))} /></Field>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-2">Subjects <span className="text-red-500">*</span></p>
          <div className="grid grid-cols-3 gap-2">
            {ALL_SUBJECTS.map(sub => (
              <label key={sub} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-gray-50 rounded-lg px-3 py-2">
                <input type="checkbox" className="rounded" checked={form.subjects.includes(sub)} onChange={() => toggleSubject(sub)} />{sub}
              </label>
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// SCHEDULE INTERVIEW MODAL
// ============================================================
export const ScheduleInterviewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { data: appRes } = useApplicants();
  const applicants = (appRes?.data ?? []) as any[];
  const createInterview = useCreateInterview();
  const { data: staffData } = useStaffList();

  const [form, setForm] = useState({
    applicantId: '', applicantName: '', type: 'both' as 'student' | 'parent' | 'both',
    scheduledDate: '', scheduledTime: '', venue: '', interviewers: [] as string[], notes: '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleInterviewer = (s: string) =>
    setForm(f => ({ ...f, interviewers: f.interviewers.includes(s) ? f.interviewers.filter(x => x !== s) : [...f.interviewers, s] }));

  const handleSave = () => {
    if (!form.applicantId || !form.scheduledDate || !form.scheduledTime) {
      toast.error('Please fill in all required fields'); return;
    }
    createInterview.mutate(
      { ...form, schoolSlug: 'demo-school', academicYear: '2025-26' },
      {
        onSuccess: () => { toast.success('Interview scheduled'); onClose(); },
        onError:   () => toast.error('Failed to schedule interview'),
      },
    );
  };

  return (
    <ModalWrapper title="Schedule Interview" onClose={onClose} size="md"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} icon={<Calendar size={12} />}>{createInterview.isPending ? 'Scheduling…' : 'Schedule Interview'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Applicant" required col={2}>
            <Select value={form.applicantId} onChange={e => {
              const app = applicants.find(a => (a._id || a.id) === e.target.value);
              set('applicantId', e.target.value);
              if (app) set('applicantName', `${app.firstName} ${app.lastName}`);
            }}>
              <option value="">Select Applicant</option>
              {applicants.map(a => <option key={(a._id || a.id)} value={(a._id || a.id)}>{a.firstName} {a.lastName} · {a.applicationNumber}</option>)}
            </Select>
          </Field>
          <Field label="Interview Type">
            <Select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="student">Student Only</option>
              <option value="parent">Parent Only</option>
              <option value="both">Student & Parent</option>
            </Select>
          </Field>
          <Field label="Date" required><Input type="date" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} /></Field>
          <Field label="Time" required><Input type="time" value={form.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} /></Field>
          <Field label="Venue"><Input placeholder="e.g. Principal's Office" value={form.venue} onChange={e => set('venue', e.target.value)} /></Field>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-600 mb-2">Interview Panel</p>
          <div className="grid grid-cols-2 gap-2">
            {(staffData || []).slice(0, 6).map((s: any) => (
              <label key={s._id} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-gray-50 rounded-lg px-3 py-2">
                <input type="checkbox" className="rounded" checked={form.interviewers.includes(s._id)} onChange={() => toggleInterviewer(s._id)} />{s.firstName} {s.lastName}
              </label>
            ))}
          </div>
        </div>
        <Field label="Pre-interview Notes">
          <Textarea rows={2} placeholder="Notes for the panel before the interview..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Field>
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// PROCESS ENROLLMENT MODAL
// ============================================================
export const ProcessEnrollmentModal: React.FC<{ applicant?: Applicant; onClose: () => void }> = ({ applicant, onClose }) => {
  const createEnrollment = useCreateEnrollment();
  const applicantId = applicant ? ((applicant as any)._id || applicant.id) : '';

  const [form, setForm] = useState({
    classAssigned: '', rollNumber: '', admissionFee: 15000,
    feeReceiptNumber: '', feePaidDate: '', orientationDate: '',
    documentsComplete: false, idCardIssued: false, uniformIssued: false,
    admissionFeePaid: false,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!applicantId) { toast.error('No applicant selected'); return; }
    createEnrollment.mutate(
      {
        applicantId,
        studentName: applicant ? `${applicant.firstName} ${applicant.lastName}` : '',
        applicationNumber: applicant?.applicationNumber || '',
        gradeEnrolled: applicant?.gradeApplied || '',
        campusId: applicant?.campusId || 'main',
        academicYear: applicant?.academicYear || '2025-26',
        ...form,
      },
      {
        onSuccess: () => { toast.success('Enrollment confirmed'); onClose(); },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to process enrollment'),
      },
    );
  };

  return (
    <ModalWrapper title="Process Enrollment"
      subtitle={applicant ? `${applicant.firstName} ${applicant.lastName} · ${applicant.gradeApplied}` : 'New Enrollment'}
      onClose={onClose} size="lg"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={handleSave} icon={<CheckCircle size={12} />}>{createEnrollment.isPending ? 'Processing…' : 'Confirm Enrollment'}</BtnPrimary></>}>
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-600" />
          <p className="text-xs text-emerald-800">Student has been accepted. Complete enrollment by confirming fee payment and class assignment.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class / Section" required>
            <Select value={form.classAssigned} onChange={e => set('classAssigned', e.target.value)}>
              <option value="">Select Section</option>{['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
            </Select>
          </Field>
          <Field label="GR No"><Input placeholder="e.g. 0942" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} /></Field>
          <Field label="Admission Fee (PKR)" required><Input type="number" value={form.admissionFee} onChange={e => set('admissionFee', Number(e.target.value))} /></Field>
          <Field label="Fee Receipt No."><Input placeholder="RCP-2025-XXXX" value={form.feeReceiptNumber} onChange={e => set('feeReceiptNumber', e.target.value)} /></Field>
          <Field label="Fee Paid Date"><Input type="date" value={form.feePaidDate} onChange={e => { set('feePaidDate', e.target.value); set('admissionFeePaid', !!e.target.value); }} /></Field>
          <Field label="Orientation Date"><Input type="date" value={form.orientationDate} onChange={e => set('orientationDate', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Documents Complete', key: 'documentsComplete' },
            { label: 'ID Card Issued',     key: 'idCardIssued'     },
            { label: 'Uniform Issued',     key: 'uniformIssued'    },
          ].map(item => (
            <label key={item.key} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-gray-50 rounded-lg px-3 py-2.5">
              <input type="checkbox" className="rounded" checked={(form as any)[item.key]} onChange={e => set(item.key, e.target.checked)} />{item.label}
            </label>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
};

// ============================================================
// GENERATE REPORT MODAL
// ============================================================
export const GenerateReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalWrapper title="Generate Admission Report" onClose={onClose} size="md"
    footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary icon={<Download size={12} />}>Generate & Download</BtnPrimary></>}>
    <div className="space-y-4">
      <Field label="Report Type" required>
        <Select>
          <option>Lead Summary Report</option>
          <option>Application Status Report</option>
          <option>Enrollment Report</option>
          <option>Source Performance Report</option>
          <option>Grade Demand Analysis</option>
          <option>Staff Performance Report</option>
          <option>Full Admission Lifecycle Report</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From Date"><Input type="date" /></Field>
        <Field label="To Date"><Input type="date" /></Field>
        <Field label="Campus">
          <Select><option>All Campuses</option><option>Main Campus</option><option>North Campus</option></Select>
        </Field>
        <Field label="Format">
          <Select><option>PDF</option><option>Excel (.xlsx)</option><option>CSV</option></Select>
        </Field>
      </div>
      <Field label="Include Sections">
        <div className="grid grid-cols-2 gap-2 mt-1">
          {['Summary Charts', 'Detailed Table', 'Stage Breakdown', 'Source Analysis', 'Staff Assignment', 'Trend Data'].map(s => (
            <label key={s} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />{s}
            </label>
          ))}
        </div>
      </Field>
    </div>
  </ModalWrapper>
);
