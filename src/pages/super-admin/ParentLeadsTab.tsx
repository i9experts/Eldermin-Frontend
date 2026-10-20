// ============================================================
// SUPER ADMIN — PARENT LEADS
// SmartVan parent-app self-serve registrations, including parents
// whose school isn't an Eldermin customer yet - growth/sales
// intelligence on where to prioritize outreach.
// Eldermin SaaS Platform | React + TypeScript + Tailwind + recharts
// ============================================================

import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Users, MapPin, School, TrendingUp, Filter } from 'lucide-react';
import { useParentLeads, useParentLeadFilterOptions, useParentLeadInsights } from '../../hooks/useSuperAdmin';
import { Sel } from './shared';
import { PARENT_LEAD_GRADES } from './parentLeadConstants';

// Validated with the dataviz skill's validate_palette.js (categorical, light
// mode) - fixed hue order, never cycled or reassigned when a filter changes
// which series are present.
const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const DEFAULT_FILTERS = {
  country: '', city: '', district: '', schoolName: '',
  linked: '', gradeBand: '', grade: '', dateFrom: '', dateTo: '',
};

export const ParentLeadsTab: React.FC = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const { data: options } = useParentLeadFilterOptions();
  const { data: insights } = useParentLeadInsights(activeFilters);
  const { data: leadsData, isLoading } = useParentLeads({ ...activeFilters, page, limit: 25 });

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };
  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setPage(1); };

  const leads = leadsData?.leads || [];
  const total = leadsData?.total || 0;
  const totals = insights?.totals || { total: 0, linked: 0, unlinked: 0 };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Parent Leads</h2>
        <p className="text-xs text-gray-400">SmartVan parent-app registrations — including parents waiting on a school that isn't an Eldermin customer yet</p>
      </div>

      {/* ── Stat tiles ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Users size={16} /></div>
          <div><p className="text-xl font-bold text-gray-800">{totals.total}</p><p className="text-[10px] text-gray-400">Total Registrations</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><School size={16} /></div>
          <div><p className="text-xl font-bold text-emerald-700">{totals.linked}</p><p className="text-[10px] text-gray-400">School Already Onboarded</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><MapPin size={16} /></div>
          <div><p className="text-xl font-bold text-amber-700">{totals.unlinked}</p><p className="text-[10px] text-gray-400">Waiting On Their School</p></div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-gray-500"><Filter size={13} /> Filters</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Sel value={filters.country} onChange={e => setFilter('country', e.target.value)}>
            <option value="">All Countries</option>
            {(options?.countries || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
          </Sel>
          <Sel value={filters.city} onChange={e => setFilter('city', e.target.value)}>
            <option value="">All Cities</option>
            {(options?.cities || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
          </Sel>
          <Sel value={filters.district} onChange={e => setFilter('district', e.target.value)}>
            <option value="">All Districts</option>
            {(options?.districts || []).map((d: string) => <option key={d} value={d}>{d}</option>)}
          </Sel>
          <input value={filters.schoolName} onChange={e => setFilter('schoolName', e.target.value)} placeholder="Search school name…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-300" />
          <Sel value={filters.linked} onChange={e => setFilter('linked', e.target.value)}>
            <option value="">All (linked + waiting)</option>
            <option value="true">School already onboarded</option>
            <option value="false">Waiting on their school</option>
          </Sel>
          <Sel value={filters.gradeBand} onChange={e => setFilter('gradeBand', e.target.value)}>
            <option value="">Primary + Secondary</option>
            <option value="primary">Primary only</option>
            <option value="secondary">Secondary only</option>
          </Sel>
          <Sel value={filters.grade} onChange={e => setFilter('grade', e.target.value)}>
            <option value="">All Grades</option>
            {PARENT_LEAD_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </Sel>
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 font-medium underline">Clear filters</button>
        </div>
      </div>

      {/* ── Charts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 mb-3">Registrations by City</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(insights?.byLocation || []).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="city" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[0]} name="Registrations" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5"><TrendingUp size={13} /> Registration Trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={insights?.registrationTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="count" stroke={CHART_COLORS[1]} strokeWidth={2} name="New Registrations" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top schools parents are waiting on - the single most actionable view ── */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><School size={13} /> Top Schools Parents Are Waiting On</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Schools with no matching Eldermin institution yet, ranked by how many parents have registered waiting for them — the clearest signal of where to sell next.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {(insights?.topUnlinkedSchools || []).length === 0 && (
            <p className="text-xs text-gray-400 py-6 text-center">No unlinked schools match the current filters.</p>
          )}
          {(insights?.topUnlinkedSchools || []).map((s: any, i: number) => (
            <div key={s.schoolName} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-xs font-medium text-gray-700">{s.schoolName}</span>
              </div>
              <span className="text-xs font-bold text-amber-700">{s.count} parent{s.count > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lead list ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-3 px-4 text-left font-semibold">Parent</th>
              <th className="py-3 px-4 text-left font-semibold">School (as typed)</th>
              <th className="py-3 px-4 font-semibold">Location</th>
              <th className="py-3 px-4 font-semibold">Children</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Registered</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50"><td colSpan={6} className="py-3 px-4"><div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" /></td></tr>
            ))}
            {!isLoading && leads.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">No parent leads match the current filters</td></tr>
            )}
            {leads.map((l: any) => (
              <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-800">{l.fullName}</p>
                  <p className="text-[10px] text-gray-400">{l.email}{l.phone ? ` · ${l.phone}` : ''}</p>
                </td>
                <td className="py-3 px-4 text-gray-700">{l.schoolNameRaw}</td>
                <td className="py-3 px-4 text-center text-gray-600">{[l.location?.city, l.location?.country].filter(Boolean).join(', ') || '—'}</td>
                <td className="py-3 px-4 text-center text-gray-600">{(l.children || []).map((c: any) => c.grade).filter(Boolean).join(', ') || '—'}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.isLinked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {l.isLinked ? 'Onboarded' : 'Waiting'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-gray-500">{new Date(l.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>Page {page} of {Math.ceil(total / 25)} ({total} total)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40">Prev</button>
              <button disabled={page >= Math.ceil(total / 25)} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentLeadsTab;
