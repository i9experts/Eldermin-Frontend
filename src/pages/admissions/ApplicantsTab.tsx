import React, { useState, useMemo } from 'react';
import {
  Search, Plus, FileText, CheckCircle,
  XCircle, Clock, ChevronRight,
  Download, RefreshCw,
} from 'lucide-react';
import { Applicant, ApplicationStatus, ApplicationStage } from './types';
import { APPLICATION_STATUSES, APPLICATION_STAGES, GRADES } from './constants';
import { useApplicants } from '../../hooks/useAdmissions';

// ── Stage Stepper ─────────────────────────────────────────────
const StageStepper: React.FC<{ current: ApplicationStage }> = ({ current }) => {
  const currentIdx = APPLICATION_STAGES.findIndex(s => s.value === current);
  return (
    <div className="flex items-center gap-0">
      {APPLICATION_STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={stage.value}>
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all
                ${done ? 'bg-emerald-500 border-emerald-500 text-white' :
                  active ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white' :
                  'bg-white border-gray-200 text-gray-400'}`}>
                {done ? <CheckCircle size={12} /> : stage.step}
              </div>
              <span className={`text-[8px] mt-1 font-medium ${active ? 'text-[#1e3a5f]' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                {stage.label}
              </span>
            </div>
            {idx < APPLICATION_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-3 ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} style={{ minWidth: 12 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge: React.FC<{ status: ApplicationStatus }> = ({ status }) => {
  const found = APPLICATION_STATUSES.find(s => s.value === status);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${found?.color || 'bg-gray-100 text-gray-600'}`}>
      {found?.label || status}
    </span>
  );
};

// ── Document Status Icon ──────────────────────────────────────
const DocStatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'verified') return <CheckCircle size={12} className="text-emerald-500" />;
  if (status === 'rejected') return <XCircle size={12} className="text-red-500" />;
  return <Clock size={12} className="text-amber-500" />;
};

// ── Applicant Card ────────────────────────────────────────────
const ApplicantCard: React.FC<{
  applicant: Applicant;
  onView: (a: Applicant) => void;
}> = ({ applicant, onView }) => {
  const docs = applicant.documents ?? [];
  const docsVerified = docs.filter(d => d.status === 'verified').length;
  const totalDocs = docs.length;
  const docProgress = totalDocs > 0 ? (docsVerified / totalDocs) * 100 : 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => onView(applicant)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-blue-400 flex items-center justify-center text-white font-bold text-sm">
            {applicant.firstName?.[0]}{applicant.lastName?.[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{applicant.firstName} {applicant.lastName}</p>
            <p className="text-[10px] text-gray-400">{applicant.applicationNumber} · {applicant.gradeApplied}</p>
          </div>
        </div>
        <StatusBadge status={applicant.status} />
      </div>

      <div className="mb-3 overflow-x-auto">
        <StageStepper current={applicant.stage} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
        <div className="text-[10px] text-gray-500"><span className="text-gray-400">Father:</span> {applicant.fatherName || '—'}</div>
        <div className="text-[10px] text-gray-500"><span className="text-gray-400">Phone:</span> {applicant.guardianPhone || '—'}</div>
        <div className="text-[10px] text-gray-500"><span className="text-gray-400">Prev School:</span> {applicant.previousSchool || '—'}</div>
        <div className="text-[10px] text-gray-500"><span className="text-gray-400">Assigned:</span> {applicant.assignedTo || '—'}</div>
      </div>

      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-gray-600">Documents</span>
          <span className="text-[10px] text-gray-500">{docsVerified}/{totalDocs} verified</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${docProgress === 100 ? 'bg-emerald-500' : docProgress > 50 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${docProgress}%` }}
          />
        </div>
        {docs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {docs.map((doc, i) => (
              <div key={(doc as any)._id || doc.id || i} className="flex items-center gap-0.5 text-[9px] text-gray-500">
                <DocStatusIcon status={doc.status} />
                <span>{doc.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-gray-400">
          Submitted: {applicant.submittedAt ? new Date(applicant.submittedAt).toLocaleDateString() : '—'}
        </span>
        <button className="text-[10px] font-medium text-[#1e3a5f] hover:underline flex items-center gap-0.5">
          View Full <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
};

// ── Main Applicants Tab ───────────────────────────────────────
interface ApplicantsTabProps {
  onOpenModal: (modal: string, data?: Applicant) => void;
}

const ApplicantsTab: React.FC<ApplicantsTabProps> = ({ onOpenModal }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { data: res, isLoading } = useApplicants();
  const applicants: Applicant[] = (res?.data ?? []) as Applicant[];

  const filtered = useMemo(() => {
    return applicants.filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        (a.applicationNumber || '').toLowerCase().includes(q) ||
        (a.guardianEmail || '').toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchStage  = filterStage  === 'all' || a.stage  === filterStage;
      const matchGrade  = filterGrade  === 'all' || a.gradeApplied === filterGrade;
      return matchSearch && matchStatus && matchStage && matchGrade;
    });
  }, [applicants, search, filterStatus, filterStage, filterGrade]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Applications</h2>
          <p className="text-xs text-gray-400">Track all student applications through the pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            {viewMode === 'cards' ? '☰ Table' : '⊞ Cards'}
          </button>
          <button className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors">
            <Download size={12} /> Export
          </button>
          <button
            onClick={() => onOpenModal('addApplicant')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] transition-colors font-medium">
            <Plus size={14} /> New Application
          </button>
        </div>
      </div>

      {/* Status Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {APPLICATION_STATUSES.map(s => {
          const count = applicants.filter(a => a.status === s.value).length;
          if (count === 0 && s.value !== 'submitted') return null;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all
                ${filterStatus === s.value ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white' : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'}`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${filterStatus === s.value ? 'bg-white/20 text-white' : s.color}`}>
                {count}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search by name, application no., email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
          />
        </div>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Stages</option>
          {APPLICATION_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
          <option value="all">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterStage('all'); setFilterGrade('all'); }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <RefreshCw size={11} /> Reset
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {isLoading ? 'Loading…' : `${filtered.length} applications`}
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-4 border-[#1e3a5f] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Cards View */}
      {!isLoading && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <FileText size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No applications found</p>
            </div>
          ) : filtered.map(a => (
            <ApplicantCard key={(a as any)._id || a.id} applicant={a} onView={app => onOpenModal('viewApplicant', app)} />
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-100">
                <th className="py-3 px-4 font-semibold">Applicant</th>
                <th className="py-3 px-4 font-semibold">Grade</th>
                <th className="py-3 px-4 font-semibold">Stage</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Docs</th>
                <th className="py-3 px-4 font-semibold">Assigned</th>
                <th className="py-3 px-4 font-semibold">Submitted</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No applications found</td></tr>
              ) : filtered.map(app => {
                const docs = app.documents ?? [];
                const docsVerified = docs.filter(d => d.status === 'verified').length;
                const appId = (app as any)._id || app.id;
                return (
                  <tr key={appId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-[10px] font-bold">
                          {app.firstName?.[0]}{app.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{app.firstName} {app.lastName}</p>
                          <p className="text-[10px] text-gray-400">{app.applicationNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{app.gradeApplied}</td>
                    <td className="py-3 px-4 text-gray-500 capitalize">{app.stage?.replace('_', ' ')}</td>
                    <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-4 text-gray-500">{docsVerified}/{docs.length}</td>
                    <td className="py-3 px-4 text-gray-500">{app.assignedTo}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => onOpenModal('viewApplicant', app)}
                          className="text-[10px] text-[#1e3a5f] hover:underline font-medium">View</button>
                        {app.status === 'accepted' && (
                          <button onClick={() => onOpenModal('processEnrollment', app)}
                            className="text-[10px] text-emerald-600 hover:underline font-medium">Enroll</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicantsTab;
