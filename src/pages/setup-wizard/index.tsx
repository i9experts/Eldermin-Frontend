import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import onboardingService from '../../services/onboarding.service';
import {
  WizardState,
  WIZARD_STEPS,
  ALL_MODULES,
  ALL_ROLES,
  BUNDLES,
  FEE_HEADS,
} from './types';

const defaultState: WizardState = {
  institution: {
    name: '',
    type: '',
    country: '',
    city: '',
    language: '',
    currency: '',
    academicSystem: [],
    logo: null,
  },
  campuses: [{ name: '', code: '', address: '', head: '', phone: '' }],
  academics: {
    yearStart: '',
    yearEnd: '',
    terms: [],
    grades: [],
    sectionsPerGrade: 2,
    subjects: [],
  },
  selectedRoles: [...ALL_ROLES.map(r => r.name)],
  selectedModules: [0, 1, 2, 3, 4, 5],
  finance: {
    feeFrequency: '',
    lateFeePolicy: '',
    tax: '',
    bankAccount: '',
    feeHeads: [],
    payrollStructure: '',
  },
  documents: {
    admissionDocs: [],
    employeeDocs: [],
    policyDocs: [],
  },
};

const ACADEMIC_SYSTEMS = ['Cambridge (O/A Levels)', 'FBISE / National', 'IB (International Baccalaureate)', 'American Curriculum', 'Custom / Hybrid'];
const TERMS_OPTIONS = ['Term 1 / Term 2', 'Semester (2 terms)', 'Quarter (4 terms)', 'Monthly'];
const GRADES_OPTIONS = ['Pre-K / Nursery', 'KG / Reception', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (A-Level / FS1)', 'Grade 12 (A-Level / FS2)'];
const SUBJECTS_OPTIONS = ['English', 'Mathematics', 'Science', 'Urdu', 'Islamiat', 'Social Studies', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Art & Design', 'Physical Education'];
const ADMISSION_DOCS = ['Birth Certificate', 'Previous School TC', 'Medical Records', 'Parent CNIC', 'Passport Photos', 'Previous Report Card'];
const EMPLOYEE_DOCS = ['CNIC Copy', 'Degree Certificates', 'Experience Letters', 'Police Clearance', 'Medical Fitness', 'Bank Details'];
const POLICY_DOCS = ['Academic Policy', 'HR Policy', 'Fee Policy', 'Discipline Policy', 'Health & Safety', 'Data Protection'];

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(defaultState);
  const [selectedModules, setSelectedModules] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    new Set(ALL_ROLES.map(r => r.name))
  );
  const [saving, setSaving] = useState(false);

  // Maps this step's collected state to exactly what the backend expects -
  // see OnboardingService.applyStepToSchool. Steps not listed here (5, 8)
  // are handled separately since 5 needs a dedicated real module-activation
  // call and 8 is the final completion call, not a saveStep.
  function buildStepPayload(stepNum: number): Record<string, any> | null {
    switch (stepNum) {
      case 1:
        return {
          country: state.institution.country,
          city: state.institution.city,
          currency: state.institution.currency,
          institutionType: state.institution.type,
          academicSystem: state.institution.academicSystem,
        };
      case 2:
        return {
          campusType: state.campuses.length > 1 ? 'multi' : 'single',
          campuses: state.campuses.filter(c => c.name.trim()),
        };
      case 3:
        return {
          yearStart: state.academics.yearStart,
          yearEnd: state.academics.yearEnd,
          terms: state.academics.terms,
          grades: state.academics.grades,
          sectionsPerGrade: state.academics.sectionsPerGrade,
          subjects: state.academics.subjects,
        };
      case 4:
        return { userRoles: [...selectedRoles] };
      case 6:
        return {
          feeFrequency: state.finance.feeFrequency,
          tax: state.finance.tax,
        };
      case 7:
        return { ...state.documents };
      default:
        return null;
    }
  }

  async function goToNextStep() {
    const payload = buildStepPayload(step);
    if (payload) {
      setSaving(true);
      try {
        await onboardingService.saveStep(step, payload);
      } catch (err: any) {
        toast.error(err.response?.data?.message || `Failed to save step ${step} - your progress on this step wasn't saved`);
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setStep(prev => prev + 1);
  }

  async function handleLaunch() {
    setSaving(true);
    try {
      // Step 5 (modules) is saved here rather than on its own "Next" click,
      // since bundle selection can change right up until the user moves on.
      await onboardingService.saveStep(5, {
        selectedModules: [...selectedModules].map(i => ALL_MODULES[i]?.name).filter(Boolean),
        selectedBundle: selectedBundle !== null ? BUNDLES[selectedBundle]?.name : undefined,
      });
      await onboardingService.complete();
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete setup - please try again');
      setSaving(false);
    }
  }

  const progressPct = ((step - 1) / (WIZARD_STEPS.length - 1)) * 100;

  const toggleChip = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Institution Profile</h2>
              <p className="text-sm text-gray-500">Tell us about your school or educational institution.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">School / Institution Name *</label>
                <input
                  type="text"
                  value={state.institution.name}
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, name: e.target.value } }))}
                  placeholder="e.g. Al-Noor Academy"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20 focus:border-[#083460]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Institution Type *</label>
                <select
                  value={state.institution.type}
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, type: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20 focus:border-[#083460]/40"
                >
                  <option value="">Select type...</option>
                  <option>Primary School</option>
                  <option>Secondary School</option>
                  <option>Higher Secondary</option>
                  <option>K-12 Full School</option>
                  <option>College / University</option>
                  <option>Madrasah / Islamic School</option>
                  <option>Vocational Institute</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Country *</label>
                <select
                  value={state.institution.country}
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, country: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20 focus:border-[#083460]/40"
                >
                  <option value="">Select country...</option>
                  <option>Pakistan</option>
                  <option>United Arab Emirates</option>
                  <option>Saudi Arabia</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>Malaysia</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                <input
                  type="text"
                  value={state.institution.city}
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, city: e.target.value } }))}
                  placeholder="e.g. Karachi"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20 focus:border-[#083460]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Primary Language</label>
                <select
                  value={state.institution.language}
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, language: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20 focus:border-[#083460]/40"
                >
                  <option value="">Select language...</option>
                  <option>English</option>
                  <option>Urdu</option>
                  <option>Arabic</option>
                  <option>Malay</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Default Currency</label>
                <select
                  value={state.institution.currency}
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, currency: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20 focus:border-[#083460]/40"
                >
                  <option value="">Select currency...</option>
                  <option>PKR — Pakistani Rupee</option>
                  <option>AED — UAE Dirham</option>
                  <option>SAR — Saudi Riyal</option>
                  <option>GBP — British Pound</option>
                  <option>USD — US Dollar</option>
                  <option>MYR — Malaysian Ringgit</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Academic System</label>
              <div className="flex flex-wrap gap-2">
                {(ACADEMIC_SYSTEMS || []).map(sys => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, institution: { ...prev.institution, academicSystem: toggleChip(prev.institution.academicSystem, sys) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.institution.academicSystem.includes(sys) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">School Logo</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#083460]/40 transition-colors">
                <p className="text-3xl mb-2">📷</p>
                <p className="text-sm text-gray-500 mb-2">Drag & drop your logo here, or click to browse</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setState(prev => ({ ...prev, institution: { ...prev.institution, logo: e.target.files?.[0] ?? null } }))}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="text-xs text-[#083460] font-semibold cursor-pointer hover:underline">Browse files</label>
                {state.institution.logo && <p className="text-xs text-emerald-600 mt-2 font-medium">✓ {state.institution.logo.name}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Campus Setup</h2>
              <p className="text-sm text-gray-500">Configure your campus locations.</p>
            </div>
            <div className="flex gap-2 mb-4">
              {['Single Campus', 'Multi-Campus'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (opt === 'Single Campus') {
                      setState(prev => ({ ...prev, campuses: [prev.campuses[0] || { name: '', code: '', address: '', head: '', phone: '' }] }));
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${(opt === 'Single Campus' && state.campuses.length === 1) || (opt === 'Multi-Campus' && state.campuses.length > 1) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {(state.campuses || []).map((campus, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700">Campus {idx + 1}</h3>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, campuses: prev.campuses.filter((_, i) => i !== idx) }))}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Campus Name *</label>
                      <input
                        type="text"
                        value={campus.name}
                        onChange={e => setState(prev => ({ ...prev, campuses: prev.campuses.map((c, i) => i === idx ? { ...c, name: e.target.value } : c) }))}
                        placeholder="e.g. Main Campus"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Campus Code</label>
                      <input
                        type="text"
                        value={campus.code}
                        onChange={e => setState(prev => ({ ...prev, campuses: prev.campuses.map((c, i) => i === idx ? { ...c, code: e.target.value } : c) }))}
                        placeholder="e.g. MC01"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={campus.address}
                        onChange={e => setState(prev => ({ ...prev, campuses: prev.campuses.map((c, i) => i === idx ? { ...c, address: e.target.value } : c) }))}
                        placeholder="Full campus address"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Campus Head</label>
                      <input
                        type="text"
                        value={campus.head}
                        onChange={e => setState(prev => ({ ...prev, campuses: prev.campuses.map((c, i) => i === idx ? { ...c, head: e.target.value } : c) }))}
                        placeholder="Principal / Head name"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                      <input
                        type="text"
                        value={campus.phone}
                        onChange={e => setState(prev => ({ ...prev, campuses: prev.campuses.map((c, i) => i === idx ? { ...c, phone: e.target.value } : c) }))}
                        placeholder="+92 21 xxxxxxx"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setState(prev => ({ ...prev, campuses: [...prev.campuses, { name: '', code: '', address: '', head: '', phone: '' }] }))}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-500 hover:border-[#083460]/40 hover:text-[#083460] transition-all"
            >
              + Add Another Campus
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Academic Structure</h2>
              <p className="text-sm text-gray-500">Set up your academic year, grades, and subjects.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Academic Year Start</label>
                <input
                  type="text"
                  value={state.academics.yearStart}
                  onChange={e => setState(prev => ({ ...prev, academics: { ...prev.academics, yearStart: e.target.value } }))}
                  placeholder="e.g. September 2025"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Academic Year End</label>
                <input
                  type="text"
                  value={state.academics.yearEnd}
                  onChange={e => setState(prev => ({ ...prev, academics: { ...prev.academics, yearEnd: e.target.value } }))}
                  placeholder="e.g. June 2026"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Terms / Semesters</label>
              <div className="flex flex-wrap gap-2">
                {(TERMS_OPTIONS || []).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, academics: { ...prev.academics, terms: toggleChip(prev.academics.terms, t) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.academics.terms.includes(t) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Grades / Year Groups</label>
              <div className="flex flex-wrap gap-2">
                {(GRADES_OPTIONS || []).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, academics: { ...prev.academics, grades: toggleChip(prev.academics.grades, g) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.academics.grades.includes(g) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sections per Grade</label>
              <input
                type="number"
                min={1}
                max={10}
                value={state.academics.sectionsPerGrade}
                onChange={e => setState(prev => ({ ...prev, academics: { ...prev.academics, sectionsPerGrade: parseInt(e.target.value) || 1 } }))}
                className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Subjects</label>
              <div className="flex flex-wrap gap-2">
                {(SUBJECTS_OPTIONS || []).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, academics: { ...prev.academics, subjects: toggleChip(prev.academics.subjects, s) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.academics.subjects.includes(s) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">User Roles</h2>
              <p className="text-sm text-gray-500">Select which roles will use this system.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(ALL_ROLES || []).map(role => {
                const isSelected = selectedRoles.has(role.name);
                return (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => setSelectedRoles(prev => {
                      const next = new Set(prev);
                      if (next.has(role.name)) {
                        next.delete(role.name);
                      } else {
                        next.add(role.name);
                      }
                      return next;
                    })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-amber-400 bg-[#083460] text-white' : 'border-gray-200 bg-white hover:border-[#083460]/30'}`}
                  >
                    <div className="text-2xl mb-2">{role.icon}</div>
                    <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{role.name}</p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>{role.desc}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400">{selectedRoles.size} of {ALL_ROLES.length} roles selected</p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Module Selection</h2>
              <p className="text-sm text-gray-500">Choose a bundle or customize individual modules.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Quick Bundles</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(BUNDLES || []).map((bundle, bIdx) => (
                  <button
                    key={bundle.name}
                    type="button"
                    onClick={() => {
                      setSelectedBundle(prev => prev === bIdx ? null : bIdx);
                      setSelectedModules(new Set([...bundle.mods]));
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedBundle === bIdx ? 'border-[#083460] bg-[#083460]/5' : 'border-gray-200 hover:border-[#083460]/30'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-800">{bundle.name}</p>
                      {bundle.recommended && <span className="text-[10px] bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">Recommended</span>}
                    </div>
                    <p className="text-xs text-gray-500">{bundle.desc}</p>
                    <p className="text-xs text-[#083460] font-semibold mt-1">{bundle.mods.length} modules</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Custom Selection ({selectedModules.size} selected)</h3>
              <div className="grid grid-cols-3 gap-2">
                {(ALL_MODULES || []).map((mod, mIdx) => {
                  const isSelected = selectedModules.has(mIdx);
                  return (
                    <button
                      key={mod.name}
                      type="button"
                      onClick={() => setSelectedModules(prev => {
                        const next = new Set(prev);
                        if (next.has(mIdx)) {
                          next.delete(mIdx);
                        } else {
                          next.add(mIdx);
                        }
                        return next;
                      })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-[#083460] bg-[#083460]/5' : 'border-gray-100 bg-gray-50 hover:border-[#083460]/30'}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xl">{mod.icon}</span>
                        {isSelected && <span className="text-emerald-500 font-bold text-sm">✓</span>}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 mt-1">{mod.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mod.desc}</p>
                      {mod.dep && <p className="text-[9px] text-amber-600 mt-1 font-medium">{mod.dep}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Financial Setup</h2>
              <p className="text-sm text-gray-500">Configure how fees and payroll are managed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fee Collection Frequency</label>
                <select
                  value={state.finance.feeFrequency}
                  onChange={e => setState(prev => ({ ...prev, finance: { ...prev.finance, feeFrequency: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                >
                  <option value="">Select...</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Per Term</option>
                  <option>Per Semester</option>
                  <option>Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Late Fee Policy</label>
                <select
                  value={state.finance.lateFeePolicy}
                  onChange={e => setState(prev => ({ ...prev, finance: { ...prev.finance, lateFeePolicy: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                >
                  <option value="">Select...</option>
                  <option>No Late Fee</option>
                  <option>Fixed Amount</option>
                  <option>Percentage (% per day)</option>
                  <option>Grace Period then Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tax Applicable</label>
                <select
                  value={state.finance.tax}
                  onChange={e => setState(prev => ({ ...prev, finance: { ...prev.finance, tax: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                >
                  <option value="">Select...</option>
                  <option>No Tax</option>
                  <option>VAT 5%</option>
                  <option>VAT 15%</option>
                  <option>GST 17%</option>
                  <option>Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bank Account (Optional)</label>
                <input
                  type="text"
                  value={state.finance.bankAccount}
                  onChange={e => setState(prev => ({ ...prev, finance: { ...prev.finance, bankAccount: e.target.value } }))}
                  placeholder="Bank name / Account no."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083460]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Fee Heads</label>
              <div className="flex flex-wrap gap-2">
                {[...FEE_HEADS].map(fh => (
                  <button
                    key={fh}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, finance: { ...prev.finance, feeHeads: toggleChip(prev.finance.feeHeads, fh) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.finance.feeHeads.includes(fh) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {fh}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Payroll Structure</label>
              <div className="flex flex-wrap gap-2">
                {['Basic + Allowances', 'Gross Salary', 'Grade-based Pay Scale', 'Contract-based'].map(ps => (
                  <button
                    key={ps}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, finance: { ...prev.finance, payrollStructure: ps } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.finance.payrollStructure === ps ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {ps}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Document Setup</h2>
              <p className="text-sm text-gray-500">Choose required documents for admissions, staff, and policies.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Admission Documents</h3>
              <div className="flex flex-wrap gap-2">
                {(ADMISSION_DOCS || []).map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, documents: { ...prev.documents, admissionDocs: toggleChip(prev.documents.admissionDocs, doc) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.documents.admissionDocs.includes(doc) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Employee Documents</h3>
              <div className="flex flex-wrap gap-2">
                {(EMPLOYEE_DOCS || []).map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, documents: { ...prev.documents, employeeDocs: toggleChip(prev.documents.employeeDocs, doc) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.documents.employeeDocs.includes(doc) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Policy Documents</h3>
              <div className="flex flex-wrap gap-2">
                {(POLICY_DOCS || []).map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, documents: { ...prev.documents, policyDocs: toggleChip(prev.documents.policyDocs, doc) } }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${state.documents.policyDocs.includes(doc) ? 'bg-[#083460] text-white border-[#083460]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#083460]/40'}`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">You're Ready to Launch!</h2>
              <p className="text-sm text-gray-500">Review your setup and launch the ERP dashboard.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Institution Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-semibold text-gray-800">{state.institution.name || '—'}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="font-semibold text-gray-800">{state.institution.type || '—'}</span></div>
                  <div><span className="text-gray-500">Country:</span> <span className="font-semibold text-gray-800">{state.institution.country || '—'}</span></div>
                  <div><span className="text-gray-500">Campuses:</span> <span className="font-semibold text-gray-800">{state.campuses.length}</span></div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Modules Activated ({selectedModules.size})</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[...selectedModules].map(mIdx => (
                    <span key={mIdx} className="text-[10px] bg-[#083460] text-white px-2 py-1 rounded-lg font-medium">
                      {ALL_MODULES[mIdx]?.icon} {ALL_MODULES[mIdx]?.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">User Roles ({selectedRoles.size})</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[...selectedRoles].map(r => (
                    <span key={r} className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded-lg font-medium">{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleLaunch}
                disabled={saving}
                className="w-full bg-amber-400 hover:bg-amber-300 font-bold text-sm px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
                style={{ color: '#083460' }}
              >
                {saving ? "Finishing…" : "🚀 Launch ERP Dashboard"}
              </button>
              <button
                type="button"
                className="w-full border border-[#083460] text-[#083460] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#083460]/5 transition-colors"
              >
                📧 Invite Users First
              </button>
              <button
                type="button"
                className="w-full border border-gray-200 text-gray-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ⚙ Edit Settings
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-5" style={{ backgroundColor: 'rgba(8,52,96,0.7)' }}>
      <div className="max-w-3xl w-full max-h-[92vh] bg-white rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex-shrink-0" style={{ background: 'linear-gradient(135deg, #083460 0%, #0C447C 100%)' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-[#083460] font-black text-sm">E</div>
              <div>
                <p className="text-white font-bold text-sm">Eldermin ERP</p>
                <p className="text-white/60 text-xs">Institution Setup Wizard</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-white/60 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Step Track */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-0">
              {(WIZARD_STEPS || []).map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s.id < step ? 'bg-emerald-500 text-white' : s.id === step ? 'bg-amber-400 text-[#083460]' : 'bg-white/10 text-white/50 border border-white/20'}`}>
                      {s.id < step ? '✓' : s.icon}
                    </div>
                    <p className={`text-[9px] mt-1 font-medium ${s.id === step ? 'text-amber-400' : s.id < step ? 'text-emerald-400' : 'text-white/40'}`}>{s.label}</p>
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${s.id < step ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-3">
              <div className="h-1 bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderStep()}
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white">
          <span className="text-xs text-gray-400 font-medium">Step {step} of 8</span>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
            )}
            {step < 8 ? (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={saving}
                className="px-5 py-2 text-white text-sm font-bold rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#083460' }}
              >
                {saving ? "Saving…" : "Next Step →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={saving}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                style={{ color: '#083460' }}
              >
                {saving ? "Finishing…" : "🚀 Launch Dashboard"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
