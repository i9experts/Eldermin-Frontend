// ============================================================
// VISIT RECORDS — Sales rep institution site-visit log
// Internal CRM: field reps log visits to schools/colleges/coaching
// centres etc. to qualify leads for Eldermin (ERP) and SmartVan.
// Company-internal data, not scoped to any school tenant - see
// src/visit-records/ on the backend. Deliberately separate from the
// CRM tab's MarketingLead pipeline (inbound web leads vs. outbound
// rep activity).
// ============================================================
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  MapPin, Search, Plus, Send, Camera, Loader2, Phone,
  CheckCircle2, Clock, Building2,
} from 'lucide-react';
import {
  useVisitRecords, useVisitRecordStats, useCreateVisitRecord, useUpdateVisitRecord,
  useUploadVisitRecordPhoto, useAddVisitRecordFollowUpNote,
} from '../../hooks/useVisitRecords';
import { Modal, Field, Input, Sel, BtnPrimary, BtnSecondary } from './shared';

// ── Option lists (adapted from the standard retail-shop-survey layout
// this was modeled on, for an educational-institution visit instead) ──
const INSTITUTION_TYPES = [
  { value: 'school', label: 'School' },
  { value: 'college', label: 'College' },
  { value: 'university', label: 'University' },
  { value: 'coaching_centre', label: 'Coaching Centre' },
  { value: 'technical_centre', label: 'Technical Centre' },
  { value: 'tuition_centre', label: 'Tuition Centre' },
  { value: 'academy', label: 'Academy' },
  { value: 'other', label: 'Other' },
];
const FEE_TIERS = [{ value: 'budget', label: 'Budget' }, { value: 'mid', label: 'Mid' }, { value: 'premium', label: 'Premium' }];
const CAMPUS_COUNTS = [{ value: 'single', label: 'Single campus' }, { value: '2_3', label: '2–3 campuses' }, { value: '4_plus', label: '4+ campuses' }];
const STUDENT_COUNTS = [{ value: 'under_50', label: '<50' }, { value: '50_200', label: '50–200' }, { value: '200_500', label: '200–500' }, { value: '500_1000', label: '500–1000' }, { value: '1000_plus', label: '1000+' }];
const STAFF_COUNTS = [{ value: 'under_10', label: '<10' }, { value: '10_30', label: '10–30' }, { value: '30_60', label: '30–60' }, { value: '60_plus', label: '60+' }];
const CONTACT_ROLES = [{ value: 'owner', label: 'Owner' }, { value: 'principal', label: 'Principal' }, { value: 'admin', label: 'Admin' }, { value: 'coordinator', label: 'Coordinator' }, { value: 'teacher', label: 'Teacher' }, { value: 'other', label: 'Other' }];
const BEST_TIMES = [{ value: 'morning', label: 'Morning' }, { value: 'afternoon', label: 'Afternoon' }, { value: 'evening', label: 'Evening' }, { value: 'after_closing', label: 'After closing' }];
const CURRENT_SYSTEMS = [{ value: 'manual_register', label: 'Manual register' }, { value: 'excel', label: 'Excel' }, { value: 'software', label: 'Software (name it)' }, { value: 'none', label: 'None' }];
const TRANSPORT_STATUSES = [{ value: 'own_fleet', label: 'Own fleet' }, { value: 'outsourced', label: 'Outsourced' }, { value: 'none', label: 'No transport' }];
const TRANSPORT_TRACKING = [{ value: 'none', label: 'None' }, { value: 'manual_calls', label: 'Manual / calling parents' }, { value: 'gps_app', label: 'GPS app' }, { value: 'other', label: 'Other' }];
const FEE_CONCESSIONS = [{ value: 'none', label: 'None' }, { value: 'informal', label: 'Informal' }, { value: 'structured', label: 'Structured' }];
const ADMISSION_SEASONS = [{ value: 'jan_mar', label: 'Jan–Mar' }, { value: 'apr_jun', label: 'Apr–Jun' }, { value: 'jul_sep', label: 'Jul–Sep' }, { value: 'oct_dec', label: 'Oct–Dec' }, { value: 'year_round', label: 'Year-round' }];
const INTEREST_LEVELS = [
  { value: 'none', label: 'Not interested', color: 'bg-gray-100 text-gray-500' },
  { value: 'curious', label: 'Curious', color: 'bg-blue-100 text-blue-700' },
  { value: 'interested', label: 'Interested', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'demo_scheduled', label: 'Demo scheduled', color: 'bg-purple-100 text-purple-700' },
  { value: 'hot', label: 'Hot lead', color: 'bg-red-100 text-red-700' },
];

const interestConfig = (v: string) => INTEREST_LEVELS.find(i => i.value === v) || INTEREST_LEVELS[0];

// ── Shared chip-select, single or multi ─────────────────────────────
function ChipGroup({ options, value, onChange, multi }: {
  options: { value: string; label: string }[];
  value: string | string[] | undefined;
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const selectedSet = new Set(multi ? ((value as string[]) || []) : value ? [value as string] : []);
  const toggle = (v: string) => {
    if (multi) {
      const arr = (value as string[]) || [];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all
            ${selectedSet.has(opt.value) ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Add/Edit Visit modal ─────────────────────────────────────────────
function VisitFormModal({ data, onClose }: { data?: any; onClose: () => void }) {
  const isEditing = !!data;
  const createMut = useCreateVisitRecord();
  const updateMut = useUpdateVisitRecord();
  const uploadPhoto = useUploadVisitRecordPhoto();
  const addNote = useAddVisitRecordFollowUpNote();

  const [institutionName, setInstitutionName] = useState(data?.institutionName || '');
  const [institutionType, setInstitutionType] = useState(data?.institutionType || 'school');
  const [city, setCity] = useState(data?.city || '');
  const [area, setArea] = useState(data?.area || '');
  const [feeTier, setFeeTier] = useState(data?.feeTier || '');
  const [campusCount, setCampusCount] = useState(data?.campusCount || '');
  const [studentCount, setStudentCount] = useState(data?.studentCount || '');
  const [staffCount, setStaffCount] = useState(data?.staffCount || '');
  const [contactName, setContactName] = useState(data?.contactName || '');
  const [contactRole, setContactRole] = useState(data?.contactRole || '');
  const [whatsapp, setWhatsapp] = useState(data?.whatsapp || '');
  const [whatsappOk, setWhatsappOk] = useState<boolean | undefined>(data?.whatsappOk);
  const [bestTimeToContact, setBestTimeToContact] = useState<string[]>(data?.bestTimeToContact || []);
  const [email, setEmail] = useState(data?.email || '');
  const [socialOrWebsite, setSocialOrWebsite] = useState(data?.socialOrWebsite || '');
  const [currentSystem, setCurrentSystem] = useState(data?.currentSystem || '');
  const [currentSystemName, setCurrentSystemName] = useState(data?.currentSystemName || '');
  const [transportStatus, setTransportStatus] = useState(data?.transportStatus || '');
  const [transportTrackingMethod, setTransportTrackingMethod] = useState(data?.transportTrackingMethod || '');
  const [feeConcessionPlans, setFeeConcessionPlans] = useState(data?.feeConcessionPlans || '');
  const [admissionSeasons, setAdmissionSeasons] = useState<string[]>(data?.admissionSeasons || []);
  const [elderminInterest, setElderminInterest] = useState(data?.elderminInterest || 'curious');
  const [smartvanInterest, setSmartvanInterest] = useState(data?.smartvanInterest || 'none');
  const [biggestProblem, setBiggestProblem] = useState(data?.biggestProblem || '');
  const [notes, setNotes] = useState(data?.notes || '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(data?.nextFollowUpDate ? data.nextFollowUpDate.slice(0, 10) : '');

  const [location, setLocation] = useState<{ lat: number; lng: number; accuracyMeters?: number } | null>(data?.location || null);
  const [locating, setLocating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(data?.photoUrl || null);
  const [newFollowUpNote, setNewFollowUpNote] = useState('');

  const captureLocation = () => {
    if (!navigator.geolocation) { toast.error('Location is not available on this device'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyMeters: Math.round(pos.coords.accuracy) });
        setLocating(false);
      },
      () => { toast.error('Could not get location — check location permission'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); e.target.value = ''; return; }
    setPhotoFile(file);
    setPhotoPreview(prev => { if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const buildPayload = () => ({
    institutionName, institutionType, city: city || undefined, area: area || undefined,
    location: location || undefined,
    feeTier: feeTier || undefined, campusCount: campusCount || undefined,
    studentCount: studentCount || undefined, staffCount: staffCount || undefined,
    contactName: contactName || undefined, contactRole: contactRole || undefined,
    whatsapp: whatsapp || undefined, whatsappOk,
    bestTimeToContact, email: email || undefined, socialOrWebsite: socialOrWebsite || undefined,
    currentSystem: currentSystem || undefined, currentSystemName: currentSystemName || undefined,
    transportStatus: transportStatus || undefined, transportTrackingMethod: transportTrackingMethod || undefined,
    feeConcessionPlans: feeConcessionPlans || undefined, admissionSeasons,
    elderminInterest, smartvanInterest,
    biggestProblem: biggestProblem || undefined, notes: notes || undefined,
    nextFollowUpDate: nextFollowUpDate || null,
  });

  const submit = () => {
    if (!institutionName.trim()) { toast.error('Enter the institution name'); return; }
    const payload = buildPayload();
    if (isEditing) {
      updateMut.mutate({ id: data._id, data: payload }, {
        onSuccess: (res: any) => {
          toast.success('Visit record updated');
          if (photoFile) uploadPhoto.mutate({ id: res._id, file: photoFile });
          onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update visit record'),
      });
      return;
    }
    createMut.mutate(payload, {
      onSuccess: (res: any) => {
        toast.success('Visit logged');
        if (photoFile) uploadPhoto.mutate({ id: res._id, file: photoFile });
        onClose();
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to log visit'),
    });
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Modal title={isEditing ? institutionName : 'Log Institution Visit'}
      subtitle={isEditing ? `${INSTITUTION_TYPES.find(t => t.value === institutionType)?.label} · ${data.visitedByName || ''}` : 'Capture the visit — lead potential for Eldermin and SmartVan'}
      onClose={onClose} size="xl"
      footer={<><BtnSecondary onClick={onClose}>Cancel</BtnSecondary><BtnPrimary onClick={submit} disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Visit'}</BtnPrimary></>}>
      <div className="space-y-5">
        {/* INSTITUTION */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Institution</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Institution name" required><Input value={institutionName} onChange={e => setInstitutionName(e.target.value)} placeholder="e.g. Bright Future School" /></Field>
            <Field label="City"><Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Faisalabad" /></Field>
          </div>
          <Field label="Area / address"><Input value={area} onChange={e => setArea(e.target.value)} placeholder="Market/area, street, landmark…" /></Field>
          <div className="mt-3">
            <p className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</p>
            <ChipGroup options={INSTITUTION_TYPES} value={institutionType} onChange={setInstitutionType} />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button type="button" onClick={captureLocation} disabled={locating}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-medium
                ${location ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {locating ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
              {locating ? 'Locating…' : location ? `Location saved · ±${location.accuracyMeters || '?'} m` : 'Save current location'}
            </button>
            <label className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer">
              <Camera size={13} /> {photoPreview ? 'Change photo' : 'Add institution photo'}
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
            </label>
            {photoPreview && <img src={photoPreview} alt="Institution" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />}
          </div>
        </div>

        {/* PROFILE */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Profile</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Fee tier</p>
              <ChipGroup options={FEE_TIERS} value={feeTier} onChange={setFeeTier} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Campuses</p>
              <ChipGroup options={CAMPUS_COUNTS} value={campusCount} onChange={setCampusCount} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Student count</p>
              <ChipGroup options={STUDENT_COUNTS} value={studentCount} onChange={setStudentCount} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Staff count</p>
              <ChipGroup options={STAFF_COUNTS} value={staffCount} onChange={setStaffCount} />
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Owner / manager name"><Input value={contactName} onChange={e => setContactName(e.target.value)} /></Field>
            <Field label="WhatsApp"><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="03xx xxxxxxx" /></Field>
            <Field label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></Field>
            <Field label="Social / website"><Input value={socialOrWebsite} onChange={e => setSocialOrWebsite(e.target.value)} placeholder="@handle or URL" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Role</p>
              <ChipGroup options={CONTACT_ROLES} value={contactRole} onChange={setContactRole} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">OK to message on WhatsApp?</p>
              <ChipGroup options={[{ value: 'yes', label: 'Yes, permission given' }, { value: 'no', label: 'No' }]}
                value={whatsappOk === undefined ? undefined : whatsappOk ? 'yes' : 'no'}
                onChange={(v: string) => setWhatsappOk(v === 'yes')} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Best time to contact</p>
            <ChipGroup options={BEST_TIMES} value={bestTimeToContact} onChange={setBestTimeToContact} multi />
          </div>
        </div>

        {/* CURRENT SETUP */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Setup</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">School management system</p>
              <ChipGroup options={CURRENT_SYSTEMS} value={currentSystem} onChange={setCurrentSystem} />
              {currentSystem === 'software' && (
                <Input className="mt-2" value={currentSystemName} onChange={e => setCurrentSystemName(e.target.value)} placeholder="Name of the software" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Fee concession / installment plans?</p>
              <ChipGroup options={FEE_CONCESSIONS} value={feeConcessionPlans} onChange={setFeeConcessionPlans} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Transport / van service</p>
              <ChipGroup options={TRANSPORT_STATUSES} value={transportStatus} onChange={setTransportStatus} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Van tracking today</p>
              <ChipGroup options={TRANSPORT_TRACKING} value={transportTrackingMethod} onChange={setTransportTrackingMethod} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Admission season(s)</p>
            <ChipGroup options={ADMISSION_SEASONS} value={admissionSeasons} onChange={setAdmissionSeasons} multi />
          </div>
        </div>

        {/* CONVERSATION */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Conversation</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Interest in Eldermin (ERP)</p>
              <ChipGroup options={INTEREST_LEVELS} value={elderminInterest} onChange={setElderminInterest} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Interest in SmartVan</p>
              <ChipGroup options={INTEREST_LEVELS} value={smartvanInterest} onChange={setSmartvanInterest} />
            </div>
          </div>
          <Field label="Biggest problem (their exact words)">
            <textarea value={biggestProblem} onChange={e => setBiggestProblem(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none"
              placeholder="What they said, in their words…" />
          </Field>
          <Field label="Visit notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 resize-none mt-2"
              placeholder="Anything else worth remembering about this visit…" />
          </Field>
          <Field label="Next follow-up date">
            <Input type="date" className="mt-2 w-48" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} />
          </Field>
        </div>

        {isEditing && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Follow-up Log</p>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {(data.followUpNotes || []).length === 0 && <p className="text-xs text-gray-400">No follow-up activity yet.</p>}
              {(data.followUpNotes || []).slice().reverse().map((n: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                  <p className="text-gray-700">{n.text}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {n.authorName} · {new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newFollowUpNote} onChange={e => setNewFollowUpNote(e.target.value)} placeholder="Log a call / follow-up visit…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
              <BtnPrimary icon={<Send size={12} />} disabled={!newFollowUpNote.trim() || addNote.isPending}
                onClick={() => { if (newFollowUpNote.trim()) { addNote.mutate({ id: data._id, text: newFollowUpNote.trim() }); setNewFollowUpNote(''); } }}>
                Add
              </BtnPrimary>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────
export default function VisitRecordsTab() {
  const [institutionType, setInstitutionType] = useState('');
  const [elderminInterest, setElderminInterest] = useState('');
  const [pendingFollowUp, setPendingFollowUp] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<any>(undefined);
  const [showForm, setShowForm] = useState(false);

  const { data: stats } = useVisitRecordStats();
  const { data: recordsData, isLoading } = useVisitRecords({
    institutionType: institutionType || undefined,
    elderminInterest: elderminInterest || undefined,
    pendingFollowUp: pendingFollowUp || undefined,
    search: search.trim() || undefined,
  });
  const updateMut = useUpdateVisitRecord();
  const records: any[] = recordsData || [];

  const openCreate = () => { setFormData(undefined); setShowForm(true); };
  const openEdit = (record: any) => { setFormData(record); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setFormData(undefined); };

  const markFollowUpDone = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateMut.mutate({ id, data: { followUpDone: true } }, {
      onSuccess: () => toast.success('Follow-up marked done'),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Visit Records</h2>
          <p className="text-xs text-gray-400">Field sales visits to schools, colleges & training centres — lead potential for Eldermin & SmartVan</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] font-medium">
          <Plus size={14} /> Log Visit
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Visits', value: stats?.total ?? '—', bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Eldermin Hot Leads', value: stats?.elderminHotLeads ?? '—', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'SmartVan Hot Leads', value: stats?.smartvanHotLeads ?? '—', bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Follow-ups Due', value: stats?.followUpsDue ?? '—', bg: 'bg-red-50', color: 'text-red-600' },
          { label: 'Institution Types', value: stats ? Object.keys(stats.byInstitutionType || {}).length : '—', bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-gray-100`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Sel value={institutionType} onChange={e => setInstitutionType(e.target.value)} className="!w-auto">
          <option value="">All types</option>
          {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Sel>
        <Sel value={elderminInterest} onChange={e => setElderminInterest(e.target.value)} className="!w-auto">
          <option value="">Any Eldermin interest</option>
          {INTEREST_LEVELS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </Sel>
        <button onClick={() => setPendingFollowUp(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${pendingFollowUp ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-600 border-gray-200'}`}>
          Follow-ups Due
        </button>
        <div className="relative ml-auto w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institution, city, contact…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-semibold">Institution</th>
              <th className="py-3 px-4 text-left font-semibold">Contact</th>
              <th className="py-3 px-4 font-semibold">Eldermin</th>
              <th className="py-3 px-4 font-semibold">SmartVan</th>
              <th className="py-3 px-4 font-semibold">Follow-up</th>
              <th className="py-3 px-4 font-semibold">Visited</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50"><td colSpan={7} className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" /></td></tr>
            ))}
            {!isLoading && records.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-xs text-gray-400">
                <Building2 size={24} className="mx-auto mb-2 text-gray-300" />
                No visit records yet — click "Log Visit" after visiting a school, college or training centre.
              </td></tr>
            )}
            {records.map((r: any) => {
              const elderminCfg = interestConfig(r.elderminInterest);
              const smartvanCfg = interestConfig(r.smartvanInterest);
              const followUpOverdue = r.nextFollowUpDate && !r.followUpDone && new Date(r.nextFollowUpDate) <= new Date();
              return (
                <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(r)}>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{r.institutionName}</p>
                    <p className="text-[10px] text-gray-400">{INSTITUTION_TYPES.find(t => t.value === r.institutionType)?.label} · {r.city || '—'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-700">{r.contactName || '—'}</p>
                    {r.whatsapp && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={9} /> {r.whatsapp}</p>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${elderminCfg.color}`}>{elderminCfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${smartvanCfg.color}`}>{smartvanCfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.nextFollowUpDate ? (
                      r.followUpDone
                        ? <span className="text-[10px] text-emerald-600">✓ Done</span>
                        : <span className={`text-[10px] font-medium ${followUpOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                            {new Date(r.nextFollowUpDate).toLocaleDateString()}
                          </span>
                    ) : <span className="text-[10px] text-gray-300">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-[10px] text-gray-400">{new Date(r.visitDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    {r.nextFollowUpDate && !r.followUpDone && (
                      <button title="Mark follow-up done" onClick={(e) => markFollowUpDone(e, r._id)} className="text-gray-300 hover:text-emerald-600">
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && <VisitFormModal data={formData} onClose={closeForm} />}
    </div>
  );
}
