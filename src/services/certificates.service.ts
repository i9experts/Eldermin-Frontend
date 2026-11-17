import api from '../lib/api';

export const CERTIFICATE_TYPES = [
  'transfer', 'character', 'bonafide', 'provisional', 'migration',
  'merit', 'participation', 'attendance', 'graduation', 'custom',
  // LMS Phase 3 - auto-issued by CertificatesService.autoIssueCourseCompletion
  // once a default/active template of this type exists; still generatable
  // manually here like any other type.
  'course_completion',
] as const;
export type CertificateType = typeof CERTIFICATE_TYPES[number];

export interface Signatory {
  label: string;
}

// Mirrors the backend's STUDENT_MERGE_FIELDS exactly (certificate-template.schema.ts)
// - always available as {{tokens}} regardless of certificateType, since
// they come straight off the Student record.
export const STUDENT_MERGE_FIELDS: { key: string; label: string }[] = [
  { key: 'studentName', label: "Student's Name" },
  { key: 'fatherName', label: "Father's Name" },
  { key: 'motherName', label: "Mother's Name" },
  { key: 'guardianName', label: 'Guardian Name' },
  { key: 'guardianContact', label: 'Guardian Contact' },
  { key: 'admissionNo', label: 'Admission No.' },
  { key: 'grNo', label: 'GR No.' },
  { key: 'grade', label: 'Grade / Class' },
  { key: 'section', label: 'Section' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'religion', label: 'Religion' },
  { key: 'admissionDate', label: 'Admission Date' },
  { key: 'campusName', label: 'Campus Name' },
  { key: 'schoolName', label: 'School Name' },
  { key: 'issueDate', label: 'Issue Date' },
  { key: 'certificateNumber', label: 'Certificate No.' },
];

// Mirrors the backend's EXTRA_FIELD_SUGGESTIONS - per-generation fields
// that can't come from the student record, so the school fills them in
// at print time. Drives both the template editor's token palette and the
// generate modal's "fill in the blanks" form.
export const EXTRA_FIELD_SUGGESTIONS: Record<CertificateType, { key: string; label: string }[]> = {
  transfer: [
    { key: 'lastClassStudied', label: 'Last Class Studied' },
    { key: 'dateOfLeaving', label: 'Date of Leaving' },
    { key: 'reasonForLeaving', label: 'Reason for Leaving' },
    { key: 'conduct', label: 'Conduct' },
    { key: 'qualifiedForPromotion', label: 'Qualified for Promotion To' },
    { key: 'remarks', label: 'Remarks' },
  ],
  migration: [
    { key: 'dateOfLeaving', label: 'Date of Leaving' },
    { key: 'boardOrUniversity', label: 'Board / University' },
  ],
  merit: [
    { key: 'eventName', label: 'Event / Competition Name' },
    { key: 'eventDate', label: 'Event Date' },
    { key: 'position', label: 'Position / Achievement' },
  ],
  participation: [
    { key: 'eventName', label: 'Event / Activity Name' },
    { key: 'eventDate', label: 'Event Date' },
  ],
  attendance: [
    { key: 'periodLabel', label: 'Period (e.g. Academic Year 2025-26)' },
    { key: 'attendancePercentage', label: 'Attendance Percentage' },
  ],
  bonafide: [
    { key: 'purpose', label: 'Purpose (e.g. visa application, bank account)' },
  ],
  provisional: [
    { key: 'purpose', label: 'Purpose' },
  ],
  graduation: [
    { key: 'graduationYear', label: 'Graduation Year' },
    { key: 'division', label: 'Division / Grade' },
  ],
  character: [],
  custom: [],
  course_completion: [
    { key: 'courseName', label: 'Course / Subject Name' },
    { key: 'completionDate', label: 'Completion Date' },
  ],
};

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  transfer: 'Transfer / Leaving Certificate',
  character: 'Character Certificate',
  bonafide: 'Bonafide Certificate',
  provisional: 'Provisional Certificate',
  migration: 'Migration Certificate',
  merit: 'Certificate of Merit',
  participation: 'Certificate of Participation',
  attendance: 'Certificate of Attendance',
  graduation: 'Certificate of Graduation',
  custom: 'Custom Certificate',
  course_completion: 'Certificate of Course Completion',
};

// A sensible starting body per type, seeded into the editor when a school
// creates its first template of that type - not a rigid template a
// school is stuck with, just a real, usable starting point instead of a
// blank textbox, same "give a working default, not an empty canvas"
// choice made for report templates elsewhere in this app.
export const DEFAULT_BODY_TEMPLATES: Record<CertificateType, string> = {
  transfer: `<p>This is to certify that <b>{{studentName}}</b>, son/daughter of <b>{{fatherName}}</b>, bearing Admission No. <b>{{admissionNo}}</b> (GR No. {{grNo}}), was admitted to this institution on {{admissionDate}} and was studying in Class <b>{{lastClassStudied}}</b> at the time of leaving.</p>
<table>
  <tr><td>Date of Birth</td><td>{{dob}}</td><td>Gender</td><td>{{gender}}</td></tr>
  <tr><td>Nationality</td><td>{{nationality}}</td><td>Religion</td><td>{{religion}}</td></tr>
  <tr><td>Date of Leaving</td><td>{{dateOfLeaving}}</td><td>Conduct</td><td>{{conduct}}</td></tr>
</table>
<p>Reason for Leaving: {{reasonForLeaving}}</p>
<p>{{studentName}} is/is not qualified for promotion to Class {{qualifiedForPromotion}}.</p>
<p>Remarks: {{remarks}}</p>`,
  character: `<p>This is to certify that <b>{{studentName}}</b>, son/daughter of <b>{{fatherName}}</b>, Admission No. <b>{{admissionNo}}</b>, is/was a student of Class {{grade}} - {{section}} at this institution.</p>
<p>During the period of their association with this institution, their conduct and character have been found to be excellent. They are hardworking, disciplined, and respectful towards teachers and peers alike.</p>
<p>We wish them success in all future endeavours.</p>`,
  bonafide: `<p>This is to certify that <b>{{studentName}}</b>, son/daughter of <b>{{fatherName}}</b>, bearing Admission No. <b>{{admissionNo}}</b>, is a bonafide student of this institution, currently studying in Class {{grade}} - {{section}} for the academic year {{academicYear}}.</p>
<p>This certificate is issued for the purpose of {{purpose}}.</p>`,
  provisional: `<p>This is to certify that <b>{{studentName}}</b>, son/daughter of <b>{{fatherName}}</b>, bearing Admission No. <b>{{admissionNo}}</b>, has been provisionally admitted to this institution in Class {{grade}} - {{section}} for the academic year {{academicYear}}, pending submission of original documents.</p>
<p>This certificate is issued for the purpose of {{purpose}}.</p>`,
  migration: `<p>This is to certify that <b>{{studentName}}</b>, son/daughter of <b>{{fatherName}}</b>, bearing Admission No. <b>{{admissionNo}}</b>, was a student of this institution and left on {{dateOfLeaving}}.</p>
<p>No objection is raised to their migration to {{boardOrUniversity}}.</p>`,
  merit: `<p>This certificate is proudly presented to</p>
<p style="font-size:20pt;font-weight:bold;text-align:center;">{{studentName}}</p>
<p>of Class {{grade}} - {{section}} for securing <b>{{position}}</b> place in <b>{{eventName}}</b> held on {{eventDate}}.</p>
<p>In recognition of outstanding performance and dedication.</p>`,
  participation: `<p>This certificate is presented to</p>
<p style="font-size:20pt;font-weight:bold;text-align:center;">{{studentName}}</p>
<p>of Class {{grade}} - {{section}} for active participation in <b>{{eventName}}</b> held on {{eventDate}}.</p>`,
  attendance: `<p>This is to certify that <b>{{studentName}}</b>, Admission No. <b>{{admissionNo}}</b>, of Class {{grade}} - {{section}}, maintained an attendance of <b>{{attendancePercentage}}</b> during {{periodLabel}}.</p>`,
  graduation: `<p>This is to certify that <b>{{studentName}}</b>, bearing Admission No. <b>{{admissionNo}}</b>, has successfully completed the prescribed course of study at this institution and graduated in {{graduationYear}} with {{division}}.</p>`,
  custom: `<p>This is to certify that <b>{{studentName}}</b>, Admission No. <b>{{admissionNo}}</b>, of Class {{grade}} - {{section}}...</p>`,
  course_completion: `<p>This certificate is proudly presented to</p>
<p style="font-size:20pt;font-weight:bold;text-align:center;">{{studentName}}</p>
<p>of Class {{grade}} - {{section}} for successfully completing the course <b>{{courseName}}</b> on {{completionDate}}.</p>`,
};

export interface CertificateTemplate {
  _id: string;
  schoolSlug: string;
  name: string;
  certificateType: CertificateType;
  orientation: 'portrait' | 'landscape';
  layoutStyle: 'formal' | 'classic' | 'modern' | 'minimal';
  primaryColor: string;
  accentColor: string;
  backgroundImageUrl?: string;
  backgroundImageOpacity?: number;
  showBorder: boolean;
  showQrCode: boolean;
  showSeal: boolean;
  sealImageUrl?: string;
  bodyTemplate: string;
  signatories: Signatory[];
  footerNote?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface IssuedCertificate {
  _id: string;
  certificateNumber: string;
  templateId: string;
  certificateType: CertificateType;
  studentId: string;
  studentName: string;
  dataSnapshot: Record<string, string>;
  issuedBy: string;
  issuedAt: string;
}

const certificatesService = {
  listTemplates: async (certificateType?: CertificateType): Promise<CertificateTemplate[]> => {
    const { data } = await api.get('/certificates/templates', { params: { certificateType } });
    return data;
  },
  createTemplate: async (payload: Partial<CertificateTemplate>) => {
    const { data } = await api.post('/certificates/templates', payload);
    return data;
  },
  updateTemplate: async (id: string, payload: Partial<CertificateTemplate>) => {
    const { data } = await api.put(`/certificates/templates/${id}`, payload);
    return data;
  },
  deleteTemplate: async (id: string) => {
    const { data } = await api.delete(`/certificates/templates/${id}`);
    return data;
  },
  setDefaultTemplate: async (id: string) => {
    const { data } = await api.post(`/certificates/templates/${id}/set-default`);
    return data;
  },
  getIssuedForStudent: async (studentId: string): Promise<IssuedCertificate[]> => {
    const { data } = await api.get(`/certificates/students/${studentId}/issued`);
    return data;
  },
  generate: async (payload: { templateId: string; studentIds: string[]; extraFields?: Record<string, string>; issueDate?: string }, fileLabel?: string) => {
    const res = await api.post('/certificates/generate', payload, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileLabel || 'certificates'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default certificatesService;
