import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Users, MapPin, Wallet, UserPlus, UserMinus, TrendingUp,
  ShieldCheck, CalendarCheck, Grid3x3, FileDown, Printer, Plus,
  Network, Building2, ChevronRight, ChevronDown, Link2, FileText,
  Clock, Award,
} from 'lucide-react';
import hrService from '../../../services/hr.service';
import organizationService from '../../../services/organization.service';
import { CampusDropdown } from '../../teaching/tabs/shared';
import { StaffSelect } from '../../../components/ui/StaffSelect';
import { formatDate } from '../../../utils/date';
import pdfApi from '../../../services/pdf.api';

// ─── SHARED PRIMITIVES (local to this tab, same convention as TrainingTab.tsx) ──

function ModalShell({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-xl w-full my-4 ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="font-bold text-slate-900">{title}</div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[78vh]">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

function TBtn({ children, onClick, variant = 'sec', disabled = false, size = 'xs' }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'pri' | 'sec' | 'danger' | 'success'; disabled?: boolean; size?: 'xs' | 'sm';
}) {
  const cls = {
    pri:     'bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]',
    sec:     'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
    danger:  'bg-red-600 text-white hover:bg-red-700 border-red-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
  };
  const sizeCls = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-xs';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${cls[variant]} ${sizeCls} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5';

function WF({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/** Downloads the branded (school letterhead) PDF version of whatever a
 * report is already showing as CSV - same title/columns/rows, rendered
 * server-side via the generic /pdf/tabular-report endpoint so every
 * report gets a printable document, not just a CSV. */
async function downloadPdf(opts: { title: string; subtitle?: string; filterSummary?: string; columns: string[]; rows: (string | number)[][] }) {
  try {
    const blob = await pdfApi.generateTabularReportPdf(opts);
    pdfApi.downloadBlob(blob, `${opts.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to generate PDF');
  }
}

/** The CSV + PDF export pair every report ends its toolbar with - kept as
 * one component so both exports always stay in sync with each other. */
function ExportButtons({ csvFilename, csvRows, pdf }: {
  csvFilename: string; csvRows: (string | number)[][];
  pdf: { title: string; subtitle?: string; filterSummary?: string; columns: string[]; rows: (string | number)[][] };
}) {
  return (
    <div className="flex gap-2">
      <TBtn onClick={() => downloadCsv(csvFilename, csvRows)}><FileDown className="w-3.5 h-3.5" /> CSV</TBtn>
      <TBtn variant="pri" onClick={() => downloadPdf(pdf)}><FileText className="w-3.5 h-3.5" /> Download PDF</TBtn>
    </div>
  );
}

/** Wraps a report's filter controls in a card so each report reads as a
 * proper panel instead of bare form fields floating on the page. */
function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">{children}</div>;
}

function EmployeeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <WF label="Employee">
      <StaffSelect value={value} onChange={(e) => onChange(e.target.value)} placeholder="All employees" />
    </WF>
  );
}

function DepartmentInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <WF label="Department">
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="All departments" className={inputCls} />
    </WF>
  );
}

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'visiting', 'intern', 'substitute', 'volunteer'];
const STAFF_STATUSES = ['active', 'on_leave', 'resigned', 'terminated', 'probation', 'suspended'];

// ─── REPORT 1: STAFF LIST ──────────────────────────────────────────────────────

function StaffListReport() {
  const [campusId, setCampusId] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [status, setStatus] = useState('');
  const [staffId, setStaffId] = useState('');

  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ['hr-report-staff-list', campusId, department, employmentType, status, staffId],
    queryFn: () => hrService.getStaffListReport({ campusId, department, employmentType, status, staffId }),
  });
  const rows = data as any[];

  const downloadFileCover = async (staffId: string, staffName: string) => {
    try {
      const blob = await hrService.downloadStaffFileCover(staffId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || `Failed to generate file cover for ${staffName}`);
    }
  };

  const csvRows: (string | number)[][] = rows.map((s: any) => [s.employeeId, `${s.firstName} ${s.lastName}`, s.designation || '—', s.department || '—', s.campusId?.name || s.campus || '—', (s.employmentType || '').replace(/_/g, ' '), (s.status || '').replace(/_/g, ' '), s.phone || '—', s.email || '—', s.dateOfJoining ? formatDate(s.dateOfJoining) : '—']);
  const columns = ['Employee ID', 'Name', 'Designation', 'Department', 'Campus', 'Employment Type', 'Status', 'Phone', 'Email', 'Date of Joining'];

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-6 gap-3 items-end">
        <CampusDropdown value={campusId} onChange={setCampusId} />
        <DepartmentInput value={department} onChange={setDepartment} />
        <EmployeeFilter value={staffId} onChange={setStaffId} />
        <WF label="Employment Type">
          <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputCls}>
            <option value="">All types</option>
            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </WF>
        <WF label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All statuses</option>
            {STAFF_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </WF>
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
      </div>
      </FilterBar>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{rows.length} staff member{rows.length !== 1 ? 's' : ''}</p>
        <ExportButtons
          csvFilename={`staff-list-${new Date().toISOString().slice(0, 10)}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: 'Staff List', subtitle: 'Full staff directory', columns, rows: csvRows }}
        />
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {['Employee ID', 'Name', 'Designation', 'Department', 'Campus', 'Type', 'Status', 'Joined', ''].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((s: any) => (
              <tr key={s._id}>
                <td className="py-2.5 px-3 font-mono text-xs text-[#0C447C]">{s.employeeId}</td>
                <td className="py-2.5 px-3 font-medium">{s.firstName} {s.lastName}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.designation || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.department || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.campusId?.name || s.campus || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600 capitalize">{(s.employmentType || '').replace(/_/g, ' ')}</td>
                <td className="py-2.5 px-3 text-slate-600 capitalize">{(s.status || '').replace(/_/g, ' ')}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.dateOfJoining ? formatDate(s.dateOfJoining) : '—'}</td>
                <td className="py-2.5 px-3">
                  <button onClick={() => downloadFileCover(s._id, `${s.firstName} ${s.lastName}`)} title="File Cover" className="text-slate-400 hover:text-[#0C447C]">
                    <Printer className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isFetching && (
              <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">No staff match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORT 2: STAFF ALLOCATION ─────────────────────────────────────────────────

function StaffAllocationReport() {
  const [campusId, setCampusId] = useState('');
  const [staffId, setStaffId] = useState('');
  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ['hr-report-staff-allocation', campusId, staffId],
    queryFn: () => hrService.getStaffAllocationReport({ campusId, staffId }),
  });
  const groups = data as { campus: string; department: string; staff: any[] }[];
  const csvRows = groups.map((g) => [g.campus, g.department, g.staff.length, g.staff.map((s: any) => `${s.firstName} ${s.lastName}`).join('; ')]);
  const columns = ['Campus', 'Department', 'Staff Count', 'Staff Names'];

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-5 gap-3 items-end">
        <CampusDropdown value={campusId} onChange={setCampusId} />
        <EmployeeFilter value={staffId} onChange={setStaffId} />
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
      </div>
      </FilterBar>
      <div className="flex justify-end">
        <ExportButtons
          csvFilename={`staff-allocation-${new Date().toISOString().slice(0, 10)}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: 'Staff Allocation', subtitle: 'Staff grouped by campus and department', columns, rows: csvRows }}
        />
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={`${g.campus}::${g.department}`} className="border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-800">{g.campus} — {g.department}</div>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#0C447C] rounded-full font-medium">{g.staff.length} staff</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.staff.map((s: any) => (
                <span key={s._id} className="text-xs px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg">{s.firstName} {s.lastName} · {s.designation || '—'}</span>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && !isFetching && <p className="text-sm text-slate-400 text-center py-10">No active staff to allocate yet.</p>}
      </div>
    </div>
  );
}

// ─── REPORT 3: STAFF LIST WITH SALARY ───────────────────────────────────────────

function StaffSalaryReport() {
  const [campusId, setCampusId] = useState('');
  const [department, setDepartment] = useState('');
  const [staffId, setStaffId] = useState('');
  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ['hr-report-staff-salary', campusId, department, staffId],
    queryFn: () => hrService.getStaffSalaryReport({ campusId, department, staffId }),
  });
  const rows = data as any[];
  const total = rows.reduce((s, r) => s + (r.grossSalary || 0), 0);
  const csvRows = rows.map((s: any) => [s.employeeId, `${s.firstName} ${s.lastName}`, s.designation || '—', s.department || '—', s.grossSalary, s.salaryCurrency || 'PKR']);
  const columns = ['Employee ID', 'Name', 'Designation', 'Department', 'Gross Salary', 'Currency'];

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-6 gap-3 items-end">
        <CampusDropdown value={campusId} onChange={setCampusId} />
        <DepartmentInput value={department} onChange={setDepartment} />
        <EmployeeFilter value={staffId} onChange={setStaffId} />
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
      </div>
      </FilterBar>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Total Gross Salary (listed staff): <span className="font-bold text-slate-900">₨ {total.toLocaleString()}</span></p>
        <ExportButtons
          csvFilename={`staff-list-with-salary-${new Date().toISOString().slice(0, 10)}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: 'Staff List With Salary', subtitle: `Total gross salary: PKR ${total.toLocaleString()}`, columns, rows: csvRows }}
        />
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {['Employee ID', 'Name', 'Designation', 'Department', 'Gross Salary'].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((s: any) => (
              <tr key={s._id}>
                <td className="py-2.5 px-3 font-mono text-xs text-[#0C447C]">{s.employeeId}</td>
                <td className="py-2.5 px-3 font-medium">{s.firstName} {s.lastName}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.designation || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.department || '—'}</td>
                <td className="py-2.5 px-3 font-semibold">₨ {(s.grossSalary || 0).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && !isFetching && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400">No staff match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORT 4 + 5: NEW STAFF LIST / STAFF LEFT LIST ─────────────────────────────

function DateRangeStaffReport({ mode }: { mode: 'new' | 'left' }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [staffId, setStaffId] = useState('');
  const { data = [], isFetching, refetch } = useQuery({
    queryKey: [`hr-report-staff-${mode}`, from, to, staffId],
    queryFn: () => mode === 'new' ? hrService.getNewStaffReport({ from, to, staffId }) : hrService.getStaffLeftReport({ from, to, staffId }),
  });
  const rows = data as any[];
  const columns = mode === 'new'
    ? ['Employee ID', 'Name', 'Designation', 'Department', 'Date of Joining']
    : ['Name', 'Designation', 'Department', 'Exit Type', 'Last Working Day', 'Reason'];
  const csvRows = mode === 'new'
    ? rows.map((s: any) => [s.employeeId, `${s.firstName} ${s.lastName}`, s.designation || '—', s.department || '—', formatDate(s.dateOfJoining)])
    : rows.map((r: any) => [r.staffName, r.designation || '—', r.department || '—', r.exitType, r.lastWorkingDay ? formatDate(r.lastWorkingDay) : '—', r.reason || '—']);

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-4 gap-3 items-end">
        <WF label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></WF>
        <WF label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></WF>
        <EmployeeFilter value={staffId} onChange={setStaffId} />
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
      </div>
      </FilterBar>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{rows.length} record{rows.length !== 1 ? 's' : ''}</p>
        <ExportButtons
          csvFilename={`${mode === 'new' ? 'new-staff' : 'staff-left'}-${new Date().toISOString().slice(0, 10)}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: mode === 'new' ? 'New Staff List' : 'New Staff Left List', filterSummary: from || to ? `${from || '…'} to ${to || '…'}` : undefined, columns, rows: csvRows }}
        />
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {(mode === 'new' ? ['Employee ID', 'Name', 'Designation', 'Department', 'Date of Joining'] : ['Name', 'Designation', 'Department', 'Exit Type', 'Last Working Day', 'Reason']).map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {mode === 'new' ? rows.map((s: any) => (
              <tr key={s._id}>
                <td className="py-2.5 px-3 font-mono text-xs text-[#0C447C]">{s.employeeId}</td>
                <td className="py-2.5 px-3 font-medium">{s.firstName} {s.lastName}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.designation || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.department || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{formatDate(s.dateOfJoining)}</td>
              </tr>
            )) : rows.map((r: any) => (
              <tr key={r._id}>
                <td className="py-2.5 px-3 font-medium">{r.staffName}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.designation || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.department || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600 capitalize">{(r.exitType || '').replace(/_/g, ' ')}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.lastWorkingDay ? formatDate(r.lastWorkingDay) : '—'}</td>
                <td className="py-2.5 px-3 text-slate-600 max-w-[220px] truncate">{r.reason || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && !isFetching && <tr><td colSpan={mode === 'new' ? 5 : 6} className="py-10 text-center text-sm text-slate-400">No records in this range.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORT 6: INCREMENT LIST ───────────────────────────────────────────────────

function CreateIncrementModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const [form, setForm] = useState({ staffId: '', newSalary: '', effectiveDate: new Date().toISOString().slice(0, 10), reason: 'annual_review', notes: '' });
  const selectedStaff = (staffList as any[]).find((s) => s._id === form.staffId);

  const mut = useMutation({
    mutationFn: () => hrService.createIncrement({ ...form, newSalary: Number(form.newSalary) }),
    onSuccess: () => { toast.success('Increment recorded'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record increment'),
  });

  return (
    <ModalShell title="Record Salary Increment" onClose={onClose}
      footer={<><TBtn onClick={onClose}>Cancel</TBtn><TBtn variant="pri" onClick={() => mut.mutate()} disabled={!form.staffId || !form.newSalary || mut.isPending}>{mut.isPending ? 'Saving…' : 'Save Increment'}</TBtn></>}>
      <WF label="Staff Member">
        <select value={form.staffId} onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))} className={inputCls}>
          <option value="">Select staff…</option>
          {(staffList as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
        </select>
      </WF>
      {selectedStaff && <p className="text-xs text-slate-500">Current salary: <span className="font-semibold">₨ {(selectedStaff.salary || 0).toLocaleString()}</span></p>}
      <WF label="New Salary (PKR)"><input type="number" value={form.newSalary} onChange={(e) => setForm((p) => ({ ...p, newSalary: e.target.value }))} className={inputCls} /></WF>
      <WF label="Effective Date"><input type="date" value={form.effectiveDate} onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))} className={inputCls} /></WF>
      <WF label="Reason">
        <select value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className={inputCls}>
          {['annual_review', 'promotion', 'market_adjustment', 'performance', 'cost_of_living', 'other'].map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </WF>
      <WF label="Notes"><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} rows={2} /></WF>
    </ModalShell>
  );
}

function IncrementListReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [staffId, setStaffId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ['hr-report-increments', from, to, staffId],
    queryFn: () => hrService.getIncrements({ from, to, staffId }),
  });
  const rows = data as any[];
  const columns = ['Name', 'Designation', 'Department', 'Effective Date', 'Previous Salary', 'New Salary', 'Increment Amount', 'Increment %', 'Reason'];
  const csvRows = rows.map((r: any) => [r.staffName, r.designation || '—', r.department || '—', formatDate(r.effectiveDate), r.previousSalary, r.newSalary, r.incrementAmount, `${r.incrementPercent}%`, (r.reason || '').replace(/_/g, ' ')]);

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-6 gap-3 items-end">
        <WF label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></WF>
        <WF label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></WF>
        <EmployeeFilter value={staffId} onChange={setStaffId} />
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
        <div />
        <TBtn size="sm" variant="success" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Record Increment</TBtn>
      </div>
      </FilterBar>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{rows.length} increment{rows.length !== 1 ? 's' : ''}</p>
        <ExportButtons
          csvFilename={`increment-list-${new Date().toISOString().slice(0, 10)}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: 'Increment List', filterSummary: from || to ? `${from || '…'} to ${to || '…'}` : undefined, columns, rows: csvRows }}
        />
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {['Name', 'Designation', 'Effective Date', 'Previous', 'New', 'Change', '%', 'Reason'].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r: any) => (
              <tr key={r._id}>
                <td className="py-2.5 px-3 font-medium">{r.staffName}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.designation || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{formatDate(r.effectiveDate)}</td>
                <td className="py-2.5 px-3 text-slate-600">₨ {r.previousSalary.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-semibold">₨ {r.newSalary.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-emerald-600 font-medium">+₨ {r.incrementAmount.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-emerald-600">{r.incrementPercent}%</td>
                <td className="py-2.5 px-3 text-slate-600 capitalize">{(r.reason || '').replace(/_/g, ' ')}</td>
              </tr>
            ))}
            {rows.length === 0 && !isFetching && <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">No increments recorded in this range.</td></tr>}
          </tbody>
        </table>
      </div>
      {showCreate && <CreateIncrementModal onClose={() => setShowCreate(false)} onSuccess={refetch} />}
    </div>
  );
}

// ─── REPORT 7: SECURITY DEPOSITS (DEPOSIT LIST) ─────────────────────────────────

const DEPOSIT_STATUS_COLOR: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700', completed: 'bg-amber-50 text-amber-700',
  refunded: 'bg-emerald-50 text-emerald-700', forfeited: 'bg-red-50 text-red-700',
};

function CreateDepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: hrService.getStaff });
  const [form, setForm] = useState({ staffId: '', deductionType: 'fixed', fixedAmount: '', percentOfSalary: '', startDate: new Date().toISOString().slice(0, 10), durationMonths: '', targetAmount: '', notes: '' });

  const mut = useMutation({
    mutationFn: () => hrService.createSecurityDeposit({
      ...form,
      fixedAmount: Number(form.fixedAmount) || 0,
      percentOfSalary: Number(form.percentOfSalary) || 0,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
      targetAmount: Number(form.targetAmount) || 0,
    }),
    onSuccess: () => { toast.success('Security deposit plan created'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create plan'),
  });

  return (
    <ModalShell title="New Security Deposit Plan" onClose={onClose}
      footer={<><TBtn onClick={onClose}>Cancel</TBtn><TBtn variant="pri" onClick={() => mut.mutate()} disabled={!form.staffId || mut.isPending}>{mut.isPending ? 'Saving…' : 'Create Plan'}</TBtn></>}>
      <WF label="Staff Member">
        <select value={form.staffId} onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))} className={inputCls}>
          <option value="">Select staff…</option>
          {(staffList as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
        </select>
      </WF>
      <WF label="Deduction Type">
        <select value={form.deductionType} onChange={(e) => setForm((p) => ({ ...p, deductionType: e.target.value }))} className={inputCls}>
          <option value="fixed">Fixed amount per period</option>
          <option value="percentage">% of salary per period</option>
        </select>
      </WF>
      {form.deductionType === 'fixed'
        ? <WF label="Fixed Amount (PKR per period)"><input type="number" value={form.fixedAmount} onChange={(e) => setForm((p) => ({ ...p, fixedAmount: e.target.value }))} className={inputCls} /></WF>
        : <WF label="% of Salary per period"><input type="number" value={form.percentOfSalary} onChange={(e) => setForm((p) => ({ ...p, percentOfSalary: e.target.value }))} className={inputCls} /></WF>}
      <WF label="Start Date"><input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className={inputCls} /></WF>
      <WF label="Duration (months, optional)"><input type="number" value={form.durationMonths} onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))} className={inputCls} placeholder="Leave blank for indefinite" /></WF>
      <WF label="Target Amount (optional cap)"><input type="number" value={form.targetAmount} onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))} className={inputCls} placeholder="Leave blank for no cap" /></WF>
      <WF label="Notes"><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputCls} rows={2} /></WF>
    </ModalShell>
  );
}

function RecordDeductionModal({ plan, onClose, onSuccess }: { plan: any; onClose: () => void; onSuccess: () => void }) {
  const [periodLabel, setPeriodLabel] = useState('');
  const [amount, setAmount] = useState('');
  const mut = useMutation({
    mutationFn: () => hrService.recordSecurityDepositDeduction(plan._id, { periodLabel, amount: amount ? Number(amount) : undefined }),
    onSuccess: () => { toast.success('Deduction recorded'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record deduction'),
  });
  return (
    <ModalShell title={`Record Deduction — ${plan.staffName}`} onClose={onClose}
      footer={<><TBtn onClick={onClose}>Cancel</TBtn><TBtn variant="pri" onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Record'}</TBtn></>}>
      <WF label="Period (e.g. March 2026)"><input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} className={inputCls} /></WF>
      <WF label="Amount (leave blank to auto-compute from the plan)"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></WF>
    </ModalShell>
  );
}

function RefundDepositModal({ plan, onClose, onSuccess }: { plan: any; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(String(plan.accumulatedAmount || 0));
  const [notes, setNotes] = useState('');
  const [forfeit, setForfeit] = useState(false);
  const mut = useMutation({
    mutationFn: () => hrService.refundSecurityDeposit(plan._id, { amount: Number(amount), notes, forfeit }),
    onSuccess: () => { toast.success(forfeit ? 'Deposit forfeited' : 'Deposit refunded'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to process'),
  });
  return (
    <ModalShell title={`Close Deposit — ${plan.staffName}`} onClose={onClose}
      footer={<><TBtn onClick={onClose}>Cancel</TBtn><TBtn variant={forfeit ? 'danger' : 'success'} onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? 'Saving…' : forfeit ? 'Forfeit' : 'Refund'}</TBtn></>}>
      <p className="text-xs text-slate-500">Accumulated balance: <span className="font-semibold">₨ {(plan.accumulatedAmount || 0).toLocaleString()}</span></p>
      <WF label="Amount"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></WF>
      <WF label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={2} /></WF>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={forfeit} onChange={(e) => setForfeit(e.target.checked)} /> Forfeit instead of refunding (staff does not get this back)
      </label>
    </ModalShell>
  );
}

function SecurityDepositReport() {
  const [status, setStatus] = useState('');
  const [staffId, setStaffId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deductFor, setDeductFor] = useState<any>(null);
  const [refundFor, setRefundFor] = useState<any>(null);
  const { data = [], isFetching, refetch } = useQuery({
    queryKey: ['hr-report-deposits', status, staffId],
    queryFn: () => hrService.getSecurityDeposits({ status, staffId }),
  });
  const rows = data as any[];
  const totalActive = rows.filter((r) => r.status === 'active').reduce((s, r) => s + (r.accumulatedAmount || 0), 0);
  const columns = ['Name', 'Designation', 'Deduction Type', 'Amount/%', 'Start Date', 'Accumulated', 'Status'];
  const csvRows = rows.map((r: any) => [r.staffName, r.designation || '—', r.deductionType, r.deductionType === 'fixed' ? r.fixedAmount : `${r.percentOfSalary}%`, formatDate(r.startDate), r.accumulatedAmount, r.status]);

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-6 gap-3 items-end">
        <WF label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="">All statuses</option>
            {['active', 'completed', 'refunded', 'forfeited'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </WF>
        <EmployeeFilter value={staffId} onChange={setStaffId} />
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
        <div />
        <TBtn size="sm" variant="success" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> New Deposit Plan</TBtn>
      </div>
      </FilterBar>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Total held (active plans): <span className="font-bold text-slate-900">₨ {totalActive.toLocaleString()}</span></p>
        <ExportButtons
          csvFilename={`deposit-list-${new Date().toISOString().slice(0, 10)}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: 'Deposit List', subtitle: `Total held (active plans): PKR ${totalActive.toLocaleString()}`, columns, rows: csvRows }}
        />
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {['Name', 'Designation', 'Plan', 'Start Date', 'Accumulated', 'Status', ''].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r: any) => (
              <tr key={r._id}>
                <td className="py-2.5 px-3 font-medium">{r.staffName}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.designation || '—'}</td>
                <td className="py-2.5 px-3 text-slate-600">{r.deductionType === 'fixed' ? `₨ ${r.fixedAmount.toLocaleString()} / period` : `${r.percentOfSalary}% / period`}</td>
                <td className="py-2.5 px-3 text-slate-600">{formatDate(r.startDate)}</td>
                <td className="py-2.5 px-3 font-semibold">₨ {(r.accumulatedAmount || 0).toLocaleString()}</td>
                <td className="py-2.5 px-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DEPOSIT_STATUS_COLOR[r.status] || 'bg-slate-100 text-slate-600'}`}>{r.status}</span></td>
                <td className="py-2.5 px-3">
                  {r.status === 'active' && (
                    <div className="flex gap-2">
                      <button onClick={() => setDeductFor(r)} className="text-xs text-[#0C447C] hover:underline">+ Deduction</button>
                      <button onClick={() => setRefundFor(r)} className="text-xs text-emerald-600 hover:underline">Close</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isFetching && <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">No security deposit plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {showCreate && <CreateDepositModal onClose={() => setShowCreate(false)} onSuccess={refetch} />}
      {deductFor && <RecordDeductionModal plan={deductFor} onClose={() => setDeductFor(null)} onSuccess={refetch} />}
      {refundFor && <RefundDepositModal plan={refundFor} onClose={() => setRefundFor(null)} onSuccess={refetch} />}
    </div>
  );
}

// ─── REPORT 8: STAFF ATTENDANCE REPORT ──────────────────────────────────────────

/** Rate pill used for Attendance %/Punctuality % - green/amber/red by
 * threshold, so a school admin can scan the table for who needs a
 * conversation without reading every number. */
function RateBadge({ value }: { value: number }) {
  const cls = value >= 90 ? 'bg-emerald-50 text-emerald-700' : value >= 75 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{value}%</span>;
}

/** One employee's row in the attendance summary - expands in place to
 * show their day-by-day records (fetched only once expanded) rather than
 * loading every employee's daily history up front. */
function EmployeeAttendanceRow({ row, from, to }: { row: any; from: string; to: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isFetching } = useQuery({
    queryKey: ['hr-attendance-detail', row.staffId, from, to],
    queryFn: () => hrService.getStaffAttendanceReport({ from, to, staffId: row.staffId }),
    enabled: expanded,
  });
  const dailyRecords = (detail as any)?.data || [];

  const downloadEmployeePdf = async () => {
    let records = dailyRecords;
    if (records.length === 0) {
      const res = await hrService.getStaffAttendanceReport({ from, to, staffId: row.staffId });
      records = (res as any)?.data || [];
    }
    await downloadPdf({
      title: `Attendance Report — ${row.staffName}`,
      subtitle: `${row.designation || ''} ${row.department ? '· ' + row.department : ''} · Employee ID: ${row.employeeId || '—'}`,
      filterSummary: `Period: ${from || '…'} to ${to || '…'} · Attendance: ${row.attendanceRate}% · Punctuality: ${row.punctualityRate}% · Present: ${row.presentCount} · Late: ${row.lateCount} · Absent: ${row.absentCount} · On Leave: ${row.onLeaveCount}`,
      columns: ['Date', 'Status', 'Check In', 'Check Out'],
      rows: records.map((r: any) => [formatDate(r.date), (r.status || '').replace(/_/g, ' '), r.checkInTime || '—', r.checkOutTime || '—']),
    });
  };

  return (
    <>
      <tr className="hover:bg-slate-50/60">
        <td className="py-2.5 px-3">
          <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1.5 text-left">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <span className="font-medium">{row.staffName}</span>
          </button>
        </td>
        <td className="py-2.5 px-3 text-slate-600">{row.designation || '—'}</td>
        <td className="py-2.5 px-3 text-slate-600">{row.department || '—'}</td>
        <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">{row.presentCount}</td>
        <td className="py-2.5 px-3 text-center text-amber-600 font-medium">{row.lateCount}</td>
        <td className="py-2.5 px-3 text-center text-red-600 font-medium">{row.absentCount}</td>
        <td className="py-2.5 px-3 text-center text-slate-500">{row.halfDayCount}</td>
        <td className="py-2.5 px-3 text-center text-slate-500">{row.onLeaveCount}</td>
        <td className="py-2.5 px-3 text-center"><RateBadge value={row.attendanceRate} /></td>
        <td className="py-2.5 px-3 text-center"><RateBadge value={row.punctualityRate} /></td>
        <td className="py-2.5 px-3 text-slate-500">{row.avgCheckIn || '—'}{row.avgLateByMins > 0 ? <span className="text-amber-500"> (avg {row.avgLateByMins}m late)</span> : ''}</td>
        <td className="py-2.5 px-3">
          <button onClick={downloadEmployeePdf} title="Download this employee's attendance report as PDF" className="text-slate-400 hover:text-[#0C447C]">
            <FileText className="w-4 h-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={12} className="bg-slate-50/60 px-6 py-3">
            {isFetching ? (
              <p className="text-xs text-slate-400 py-2">Loading daily records…</p>
            ) : dailyRecords.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No daily records in this range.</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="text-left text-slate-400 uppercase tracking-wide">
                  <th className="py-1.5 pr-3">Date</th><th className="py-1.5 pr-3">Status</th><th className="py-1.5 pr-3">Check In</th><th className="py-1.5 pr-3">Check Out</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyRecords.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="py-1.5 pr-3 text-slate-600">{formatDate(r.date)}</td>
                      <td className="py-1.5 pr-3 text-slate-600 capitalize">{(r.status || '').replace(/_/g, ' ')}</td>
                      <td className="py-1.5 pr-3 text-slate-500">{r.checkInTime || '—'}</td>
                      <td className="py-1.5 pr-3 text-slate-500">{r.checkOutTime || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function StaffAttendanceReportTab() {
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [campusId, setCampusId] = useState('');
  const [department, setDepartment] = useState('');
  const [staffId, setStaffId] = useState('');

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['hr-report-attendance-summary', from, to, campusId, department, staffId],
    queryFn: () => hrService.getStaffAttendanceSummaryReport({ from, to, campusId, department, staffId }),
  });
  const rows = (data as any)?.rows || [];

  const schoolAvg = rows.length > 0 ? Math.round(rows.reduce((s: number, r: any) => s + r.attendanceRate, 0) / rows.length) : 0;
  const punctualAvg = rows.length > 0 ? Math.round(rows.reduce((s: number, r: any) => s + r.punctualityRate, 0) / rows.length) : 0;
  const flagged = rows.filter((r: any) => r.attendanceRate < 75 || r.punctualityRate < 75).length;

  const columns = ['Name', 'Designation', 'Department', 'Present', 'Late', 'Absent', 'Half Day', 'On Leave', 'Attendance %', 'Punctuality %', 'Avg Check-in'];
  const csvRows = rows.map((r: any) => [r.staffName, r.designation || '—', r.department || '—', r.presentCount, r.lateCount, r.absentCount, r.halfDayCount, r.onLeaveCount, `${r.attendanceRate}%`, `${r.punctualityRate}%`, r.avgCheckIn || '—']);

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-5 gap-3 items-end">
        <WF label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></WF>
        <WF label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></WF>
        <CampusDropdown value={campusId} onChange={setCampusId} />
        <DepartmentInput value={department} onChange={setDepartment} />
        <EmployeeFilter value={staffId} onChange={setStaffId} />
      </div>
      </FilterBar>
      <div className="flex justify-end"><TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn></div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Users className="w-4.5 h-4.5 text-[#0C447C]" /></div>
          <div><div className="text-lg font-bold text-slate-800">{rows.length}</div><div className="text-[10px] text-slate-500 uppercase tracking-wide">Employees</div></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Award className="w-4.5 h-4.5 text-emerald-600" /></div>
          <div><div className="text-lg font-bold text-slate-800">{schoolAvg}%</div><div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Attendance Rate</div></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0"><Clock className="w-4.5 h-4.5 text-indigo-600" /></div>
          <div><div className="text-lg font-bold text-slate-800">{punctualAvg}%</div><div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Punctuality Rate</div></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><UserMinus className="w-4.5 h-4.5 text-red-600" /></div>
          <div><div className="text-lg font-bold text-slate-800">{flagged}</div><div className="text-[10px] text-slate-500 uppercase tracking-wide">Need Attention (&lt;75%)</div></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Per-employee summary for {from || '…'} to {to || '…'}. Click a name to see their daily record.</p>
        <ExportButtons
          csvFilename={`staff-attendance-summary-${from}-to-${to}.csv`}
          csvRows={[columns, ...csvRows]}
          pdf={{ title: 'Staff Attendance Report', subtitle: `${from || '…'} to ${to || '…'} · Avg attendance ${schoolAvg}% · Avg punctuality ${punctualAvg}%`, columns, rows: csvRows }}
        />
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {['Name', 'Designation', 'Department', 'Present', 'Late', 'Absent', 'Half Day', 'On Leave', 'Attendance', 'Punctuality', 'Avg Check-in', ''].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r: any) => <EmployeeAttendanceRow key={r.staffId} row={r} from={from} to={to} />)}
            {rows.length === 0 && !isFetching && <tr><td colSpan={12} className="py-10 text-center text-sm text-slate-400">No attendance records in this range.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORT 9: MUSTER ROLL ───────────────────────────────────────────────────────

const STATUS_CODE: Record<string, string> = {
  present: 'P', absent: 'A', late: 'L', half_day: 'HD', on_leave: 'LV',
  sick_leave: 'SL', holiday: 'H', weekend: 'W', remote: 'R', extra_day: 'E',
};

function MusterRollReport() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [campusId, setCampusId] = useState('');
  const [department, setDepartment] = useState('');

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['hr-report-muster-roll', month, year, campusId, department],
    queryFn: () => hrService.getStaffMusterRoll({ month, year, campusId, department }),
  });
  const rows = (data as any)?.rows || [];
  const daysInMonth = (data as any)?.daysInMonth || 30;

  return (
    <div className="space-y-4">
      <FilterBar>
      <div className="grid grid-cols-6 gap-3 items-end">
        <WF label="Month">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputCls}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
          </select>
        </WF>
        <WF label="Year"><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} /></WF>
        <CampusDropdown value={campusId} onChange={setCampusId} />
        <DepartmentInput value={department} onChange={setDepartment} />
        <TBtn size="sm" variant="pri" onClick={() => refetch()}>{isFetching ? 'Loading…' : 'Apply Filters'}</TBtn>
      </div>
      </FilterBar>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">P = Present · A = Absent · L = Late · HD = Half Day · LV = On Leave · SL = Sick Leave · H = Holiday · W = Weekend · R = Remote</p>
        <ExportButtons
          csvFilename={`muster-roll-${year}-${String(month).padStart(2, '0')}.csv`}
          csvRows={[
            ['Employee ID', 'Name', 'Designation', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))],
            ...rows.map((r: any) => [r.employeeId, r.staffName, r.designation || '—', ...r.days.map((d: string) => STATUS_CODE[d] || '')]),
          ]}
          pdf={{
            title: 'Muster Roll', subtitle: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
            columns: ['Employee ID', 'Name', 'Designation', ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1))],
            rows: rows.map((r: any) => [r.employeeId, r.staffName, r.designation || '—', ...r.days.map((d: string) => STATUS_CODE[d] || '-')]),
          }}
        />
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="text-xs">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            <th className="sticky left-0 bg-slate-50 text-left py-2 px-3 font-semibold text-slate-500 uppercase whitespace-nowrap">Staff</th>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <th key={i} className="py-2 px-1.5 font-semibold text-slate-500 text-center w-7">{i + 1}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r: any) => (
              <tr key={r.staffId}>
                <td className="sticky left-0 bg-white py-2 px-3 font-medium whitespace-nowrap">{r.staffName} <span className="text-slate-400 font-normal">({r.employeeId})</span></td>
                {r.days.map((d: string, i: number) => (
                  <td key={i} className={`py-2 px-1.5 text-center ${d === 'absent' ? 'text-red-600 font-semibold' : d === 'present' ? 'text-emerald-600' : 'text-slate-500'}`}>{STATUS_CODE[d] || '·'}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && !isFetching && (
              <tr><td colSpan={daysInMonth + 1} className="py-10 text-center text-sm text-slate-400">No staff found for these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORT 10: ORGANIZATION HIERARCHY (Institution -> Campus -> Department -> Staff) ──

function CollapsibleNode({ icon: Icon, label, sub, count, depth, children, defaultOpen }: {
  icon: any; label: string; sub?: string; count?: number; depth: number; children?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const hasChildren = !!children;
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className={`flex items-center gap-2 py-2 px-2 rounded-lg ${hasChildren ? 'cursor-pointer hover:bg-slate-50' : ''}`} onClick={() => hasChildren && setOpen((o) => !o)}>
        {hasChildren ? (open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />) : <span className="w-3.5" />}
        <Icon className="w-4 h-4 text-[#0C447C] shrink-0" />
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {sub && <span className="text-xs text-slate-400">· {sub}</span>}
        {count !== undefined && <span className="ml-auto text-xs px-2 py-0.5 bg-blue-50 text-[#0C447C] rounded-full font-medium">{count} staff</span>}
      </div>
      {hasChildren && open && <div>{children}</div>}
    </div>
  );
}

function OrganizationHierarchyReport() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['hr-report-org-hierarchy'], queryFn: organizationService.getOrganizationHierarchy });
  const hierarchy = data as { institutions: any[]; unassignedCampuses?: any } | undefined;

  if (isLoading) return <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>;
  if (isError || !hierarchy) return <p className="text-sm text-red-500 py-10 text-center">Failed to load the organization hierarchy.</p>;

  const renderCampus = (campus: any, depth: number) => (
    <CollapsibleNode key={campus.id} icon={Building2} label={campus.name} sub={campus.principalName ? `Principal: ${campus.principalName}` : undefined} count={campus.staffCount} depth={depth} defaultOpen>
      {campus.departments.map((dept: any) => (
        <CollapsibleNode key={dept.id || 'unassigned'} icon={Users} label={dept.name} count={dept.staffCount} depth={depth + 1}>
          <div style={{ marginLeft: (depth + 2) * 20 }} className="py-1 flex flex-wrap gap-1.5">
            {dept.staff.map((s: any) => (
              <span key={s.id} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded-lg">{s.name}{s.designation ? ` · ${s.designation}` : ''}</span>
            ))}
            {dept.staff.length === 0 && <span className="text-xs text-slate-400 italic">No staff assigned</span>}
          </div>
        </CollapsibleNode>
      ))}
    </CollapsibleNode>
  );

  const totalStaff = hierarchy.institutions.reduce((s, i) => s + i.staffCount, 0) + (hierarchy.unassignedCampuses?.staffCount || 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{totalStaff} staff across {hierarchy.institutions.length} institution{hierarchy.institutions.length !== 1 ? 's' : ''}. Click a row to expand/collapse.</p>
      <div className="border border-slate-100 rounded-xl p-3">
        {hierarchy.institutions.map((inst) => (
          <CollapsibleNode key={inst.id} icon={Network} label={inst.name} count={inst.staffCount} depth={0} defaultOpen>
            {inst.campuses.length === 0
              ? <p className="text-xs text-slate-400 italic ml-9 py-2">No campuses linked to this institution yet.</p>
              : inst.campuses.map((c: any) => renderCampus(c, 1))}
          </CollapsibleNode>
        ))}
        {hierarchy.unassignedCampuses && (
          <CollapsibleNode icon={Network} label={hierarchy.unassignedCampuses.name} count={hierarchy.unassignedCampuses.staffCount} depth={0}>
            {hierarchy.unassignedCampuses.campuses.map((c: any) => renderCampus(c, 1))}
          </CollapsibleNode>
        )}
        {hierarchy.institutions.length === 0 && !hierarchy.unassignedCampuses && (
          <p className="text-sm text-slate-400 text-center py-10">No institutions or campuses set up yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── REPORT 11: STAFF REPORTING CHAIN (ORG CHART) ──────────────────────────────

function AssignManagerModal({ staff, allStaff, onClose, onSuccess }: { staff: any; allStaff: any[]; onClose: () => void; onSuccess: () => void }) {
  const [managerId, setManagerId] = useState(staff.reportingManagerId ? String(staff.reportingManagerId) : '');
  const mut = useMutation({
    mutationFn: () => hrService.setReportingManager(staff._id, managerId || null),
    onSuccess: () => { toast.success('Reporting manager updated'); onSuccess(); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update reporting manager'),
  });
  return (
    <ModalShell title={`Set Reporting Manager — ${staff.firstName} ${staff.lastName}`} onClose={onClose}
      footer={<><TBtn onClick={onClose}>Cancel</TBtn><TBtn variant="pri" onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Save'}</TBtn></>}>
      <WF label="Reports To">
        <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={inputCls}>
          <option value="">No manager (chain root)</option>
          {allStaff.filter((s: any) => s._id !== staff._id).map((s: any) => (
            <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.employeeId})</option>
          ))}
        </select>
      </WF>
    </ModalShell>
  );
}

function OrgChartNode({ node, depth, onAssign }: { node: any; depth: number; onAssign: (staff: any) => void }) {
  const [open, setOpen] = useState(depth < 2);
  const hasReports = node.directReports?.length > 0;
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-slate-50 group">
        {hasReports ? (
          <button onClick={() => setOpen((o) => !o)}>{open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}</button>
        ) : <span className="w-3.5" />}
        <span className="text-sm font-medium text-slate-800">{node.firstName} {node.lastName}</span>
        <span className="text-xs text-slate-400">{node.designation || '—'} · {node.employeeId}</span>
        {hasReports && <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#0C447C] rounded-full font-medium">{node.directReports.length} direct report{node.directReports.length !== 1 ? 's' : ''}</span>}
        <button onClick={() => onAssign(node)} className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-[#0C447C] hover:underline flex items-center gap-1"><Link2 className="w-3 h-3" /> Set Manager</button>
      </div>
      {hasReports && open && node.directReports.map((child: any) => <OrgChartNode key={child._id} node={child} depth={depth + 1} onAssign={onAssign} />)}
    </div>
  );
}

function OrgChartReport() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['hr-report-org-chart'], queryFn: hrService.getOrgChart });
  const [assignFor, setAssignFor] = useState<any>(null);
  const roots = (data as any)?.roots || [];
  const totalStaff = (data as any)?.totalStaff || 0;

  // Flat list of all staff (for the "reports to" picker) - reuse the tree
  // data itself rather than a second fetch, since it already contains
  // every active staff member.
  const flatten = (nodes: any[]): any[] => nodes.flatMap((n) => [n, ...flatten(n.directReports || [])]);
  const allStaff = flatten(roots);

  if (isLoading) return <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>;
  if (isError) return <p className="text-sm text-red-500 py-10 text-center">Failed to load the reporting chain.</p>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{totalStaff} active staff · {roots.length} without a manager set (chain root{roots.length !== 1 ? 's' : ''}). Hover a row and click "Set Manager" to link them into the chain.</p>
      <div className="border border-slate-100 rounded-xl p-3 overflow-x-auto">
        {roots.length === 0
          ? <p className="text-sm text-slate-400 text-center py-10">No active staff found.</p>
          : roots.map((node: any) => <OrgChartNode key={node._id} node={node} depth={0} onAssign={setAssignFor} />)}
      </div>
      {assignFor && <AssignManagerModal staff={assignFor} allStaff={allStaff} onClose={() => setAssignFor(null)} onSuccess={refetch} />}
    </div>
  );
}

// ─── MAIN TAB ─────────────────────────────────────────────────────────────────

type SubReport =
  | 'staffList' | 'staffAllocation' | 'staffSalary' | 'newStaff' | 'staffLeft'
  | 'increments' | 'deposits' | 'attendance' | 'musterRoll'
  | 'orgHierarchy' | 'orgChart';

const SUB_REPORTS: { id: SubReport; icon: any; title: string; desc: string }[] = [
  { id: 'staffList', icon: Users, title: 'Staff List', desc: 'Full staff directory, filterable by campus/department/type/status' },
  { id: 'staffAllocation', icon: MapPin, title: 'Staff Allocation', desc: 'Who is assigned where, grouped by campus and department' },
  { id: 'staffSalary', icon: Wallet, title: 'Staff List With Salary', desc: 'Staff directory with current gross salary' },
  { id: 'newStaff', icon: UserPlus, title: 'New Staff List', desc: 'Staff who joined within a date range' },
  { id: 'staffLeft', icon: UserMinus, title: 'New Staff Left List', desc: 'Staff who exited within a date range' },
  { id: 'increments', icon: TrendingUp, title: 'Increment List', desc: 'Salary raise history, with the ability to record a new one' },
  { id: 'deposits', icon: ShieldCheck, title: 'Deposit List', desc: 'Security deposit deduction plans, balances, and refunds' },
  { id: 'attendance', icon: CalendarCheck, title: 'Staff Attendance Report', desc: 'Comprehensive, multi-filter attendance records' },
  { id: 'musterRoll', icon: Grid3x3, title: 'Muster Roll', desc: 'Monthly staff attendance register (day-by-day grid)' },
  { id: 'orgHierarchy', icon: Network, title: 'Organization Hierarchy', desc: 'Institution → Campus → Department → staff, with counts at every level' },
  { id: 'orgChart', icon: Link2, title: 'Reporting Chain (Org Chart)', desc: 'Who reports to whom - assign and view the management tree' },
];

export default function StaffReportsTab() {
  const [active, setActive] = useState<SubReport>('staffList');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Staff & Attendance Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Printable/exportable staff lists, increments, security deposits, and comprehensive attendance reports</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {SUB_REPORTS.map((r) => (
          <button key={r.id} onClick={() => setActive(r.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${active === r.id ? 'bg-[#0C447C] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            <r.icon className="w-3.5 h-3.5" /> {r.title}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400">{SUB_REPORTS.find((r) => r.id === active)?.desc}</p>

      {active === 'staffList' && <StaffListReport />}
      {active === 'staffAllocation' && <StaffAllocationReport />}
      {active === 'staffSalary' && <StaffSalaryReport />}
      {active === 'newStaff' && <DateRangeStaffReport mode="new" />}
      {active === 'staffLeft' && <DateRangeStaffReport mode="left" />}
      {active === 'increments' && <IncrementListReport />}
      {active === 'deposits' && <SecurityDepositReport />}
      {active === 'attendance' && <StaffAttendanceReportTab />}
      {active === 'musterRoll' && <MusterRollReport />}
      {active === 'orgHierarchy' && <OrganizationHierarchyReport />}
      {active === 'orgChart' && <OrgChartReport />}
    </div>
  );
}
