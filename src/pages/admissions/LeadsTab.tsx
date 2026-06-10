import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Phone, Mail, Calendar,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Lead, LeadStatus } from './types';
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITY_COLORS } from './constants';
import { useLeads, useUpdateLead } from '../../hooks/useAdmissions';

// ── Status Badge ──────────────────────────────────────────────
const StatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => {
  const found = LEAD_STATUSES.find(s => s.value === status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${found?.color || 'bg-gray-100 text-gray-600'}`}>
      {found?.label || status}
    </span>
  );
};

// ── Lead Card (Kanban) ────────────────────────────────────────
const LeadCard: React.FC<{
  lead: Lead;
  onView: (l: Lead) => void;
  onConvert: (l: Lead) => void;
}> = ({ lead, onView, onConvert }) => (
  <div
    className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    onClick={() => onView(lead)}
  >
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="text-xs font-semibold text-gray-800">{lead.firstName} {lead.lastName}</p>
        <p className="text-[10px] text-gray-400">{lead.gradeInterested} · {lead.source.replace('_', ' ')}</p>
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${PRIORITY_COLORS[lead.priority]}`}>
        {lead.priority}
      </span>
    </div>
    <div className="space-y-1 mb-2">
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <Phone size={9} /> {lead.phone}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <Mail size={9} /> {lead.email}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <Calendar size={9} /> Follow up: {lead.followUpDate}
      </div>
    </div>
    {lead.tags && lead.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {lead.tags.map(tag => (
          <span key={tag} className="bg-indigo-50 text-indigo-600 text-[9px] px-1.5 py-0.5 rounded">#{tag}</span>
        ))}
      </div>
    )}
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-400">{lead.assignedTo}</span>
      {lead.status !== 'converted' && lead.status !== 'lost' && (
        <button
          className="opacity-0 group-hover:opacity-100 bg-emerald-50 text-emerald-600 text-[9px] px-2 py-1 rounded font-medium hover:bg-emerald-100 transition-all"
          onClick={e => { e.stopPropagation(); onConvert(lead); }}
        >
          Convert →
        </button>
      )}
    </div>
  </div>
);

// ── Kanban Column ─────────────────────────────────────────────
const KanbanColumn: React.FC<{
  status: typeof LEAD_STATUSES[0];
  leads: Lead[];
  onView: (l: Lead) => void;
  onConvert: (l: Lead) => void;
}> = ({ status, leads, onView, onConvert }) => (
  <div className="flex-shrink-0 w-56">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status.color.split(' ')[0].replace('bg-', 'bg-').replace('-100', '-500')}`} />
        <span className="text-xs font-semibold text-gray-700">{status.label}</span>
      </div>
      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{leads.length}</span>
    </div>
    <div className="space-y-2 min-h-[200px]">
      {leads.map(lead => (
        <LeadCard key={(lead as any)._id || lead.id} lead={lead} onView={onView} onConvert={onConvert} />
      ))}
      {leads.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg h-20 flex items-center justify-center text-[10px] text-gray-400">
          No leads
        </div>
      )}
    </div>
  </div>
);

// ── Table Row ─────────────────────────────────────────────────
const LeadTableRow: React.FC<{
  lead: Lead;
  onView: (l: Lead) => void;
  onConvert: (l: Lead) => void;
  onStatusChange: (id: string, status: string) => void;
}> = ({ lead, onView, onConvert, onStatusChange }) => {
  const id = (lead as any)._id || lead.id;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-3">
        <div>
          <p className="text-xs font-semibold text-gray-800">{lead.firstName} {lead.lastName}</p>
          <p className="text-[10px] text-gray-400">{id}</p>
        </div>
      </td>
      <td className="py-3 px-3">
        <p className="text-xs text-gray-600">{lead.phone}</p>
        <p className="text-[10px] text-gray-400">{lead.email}</p>
      </td>
      <td className="py-3 px-3 text-xs text-gray-600">{lead.gradeInterested}</td>
      <td className="py-3 px-3">
        <span className="text-[10px] text-gray-500 capitalize">{lead.source.replace('_', ' ')}</span>
      </td>
      <td className="py-3 px-3">
        <select
          value={lead.status}
          onClick={e => e.stopPropagation()}
          onChange={e => onStatusChange(id, e.target.value)}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/30 ${LEAD_STATUSES.find(s => s.value === lead.status)?.color || 'bg-gray-100 text-gray-600'}`}
        >
          {LEAD_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>
      <td className="py-3 px-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_COLORS[lead.priority]}`}>
          {lead.priority}
        </span>
      </td>
      <td className="py-3 px-3 text-xs text-gray-500">{lead.assignedTo}</td>
      <td className="py-3 px-3 text-xs text-gray-400">{lead.followUpDate}</td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(lead)}
            className="text-[10px] text-[#1e3a5f] hover:underline font-medium"
          >View</button>
          {lead.status !== 'converted' && lead.status !== 'lost' && (
            <button
              onClick={() => onConvert(lead)}
              className="text-[10px] text-emerald-600 hover:underline font-medium ml-1"
            >Convert</button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ── Main Leads Tab ────────────────────────────────────────────
interface LeadsTabProps {
  onOpenModal: (modal: string, data?: Lead) => void;
}

const LeadsTab: React.FC<LeadsTabProps> = ({ onOpenModal }) => {
  const [view, setView] = useState<'kanban' | 'table'>('table');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const { data: leadsResponse, isLoading } = useLeads();
  const updateLead = useUpdateLead();

  const leads: Lead[] = (leadsResponse?.data ?? []) as Lead[];

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q);
      const matchStatus = filterStatus === 'all' || l.status === filterStatus;
      const matchSource = filterSource === 'all' || l.source === filterSource;
      const matchPriority = filterPriority === 'all' || l.priority === filterPriority;
      return matchSearch && matchStatus && matchSource && matchPriority;
    });
  }, [leads, search, filterStatus, filterSource, filterPriority]);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    LEAD_STATUSES.forEach(s => { map[s.value] = []; });
    filtered.forEach(l => { if (map[l.status]) map[l.status].push(l); });
    return map;
  }, [filtered]);

  const handleView    = (lead: Lead) => onOpenModal('viewLead', lead);
  const handleConvert = (lead: Lead) => onOpenModal('convertLead', lead);

  const handleStatusChange = (id: string, status: string) => {
    updateLead.mutate(
      { id, data: { status } },
      {
        onSuccess: () => toast.success('Lead status updated'),
        onError:   () => toast.error('Failed to update status'),
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Lead Management</h2>
          <p className="text-xs text-gray-400">Track and manage prospective student leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === 'kanban' ? 'table' : 'kanban')}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            {view === 'kanban' ? '☰ Table' : '⊞ Kanban'}
          </button>
          <button
            onClick={() => onOpenModal('addLead')}
            className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#16304f] transition-colors font-medium"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-7 gap-2">
        {LEAD_STATUSES.map(s => {
          const count = leads.filter(l => l.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`rounded-lg border p-2 text-center transition-all ${filterStatus === s.value ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <p className="text-lg font-bold text-gray-800">{count}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search by name, email, phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Sources</option>
            {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Priorities</option>
            {['low', 'medium', 'high', 'urgent'].map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterSource('all'); setFilterPriority('all'); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <RefreshCw size={12} /> Reset
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {isLoading ? 'Loading…' : `${filtered.length} leads found`}
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-4 border-[#1e3a5f] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Kanban View */}
      {!isLoading && view === 'kanban' && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ minWidth: 1400 }}>
            {LEAD_STATUSES.map(status => (
              <KanbanColumn
                key={status.value}
                status={status}
                leads={leadsByStatus[status.value] || []}
                onView={handleView}
                onConvert={handleConvert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Table View */}
      {!isLoading && view === 'table' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-100">
                <th className="py-3 px-3 font-semibold">Name</th>
                <th className="py-3 px-3 font-semibold">Contact</th>
                <th className="py-3 px-3 font-semibold">Grade</th>
                <th className="py-3 px-3 font-semibold">Source</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Priority</th>
                <th className="py-3 px-3 font-semibold">Assigned</th>
                <th className="py-3 px-3 font-semibold">Follow Up</th>
                <th className="py-3 px-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-xs">No leads found</td></tr>
              ) : (
                filtered.map(lead => (
                  <LeadTableRow
                    key={(lead as any)._id || lead.id}
                    lead={lead}
                    onView={handleView}
                    onConvert={handleConvert}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadsTab;
