import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronDown } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import studentsService from '../../services/students.service';

interface Props {
  value: string;
  onChange: (studentId: string, student?: any) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional - students to hide from the results, e.g. a child a
   * guardian is already linked to when using "Link to Another Child".
   * Without this, re-selecting the same child was trivial and created
   * an exact duplicate guardian record - the real trigger behind guardians
   * appearing many times over in the Guardian Directory. */
  excludeIds?: string[];
}

// Staff naturally think "which class is this student in" before they think
// of a name to type — so this narrows by Class/Section first (real values,
// same source as the Print Report filter), then searches within that. A
// plain <select> can't reasonably hold every active student at a real
// school either (Deenway alone has ~179), so search stays available even
// with no class/section chosen at all.
export const StudentSelect: React.FC<Props> = ({ value, onChange, placeholder = 'Search by name or GR No…', disabled, excludeIds }) => {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: filterOptions } = useQuery({
    queryKey: ['students', 'filter-options'],
    queryFn: () => studentsService.getDistinctGradesSections(),
  });
  const grades: string[] = (filterOptions as any)?.grades ?? [];
  const sections: string[] = (filterOptions as any)?.sections ?? [];

  const hasFilter = !!grade || !!section || query.trim().length >= 2;
  const { data: studentsData, isLoading } = useStudents({
    status: 'active', limit: 20,
    grade: grade || undefined,
    section: section || undefined,
    search: query.trim().length >= 2 ? query.trim() : undefined,
  });
  const students = (studentsData?.data ?? []).filter((s: any) => !excludeIds?.includes(s._id));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { if (!value) setSelectedLabel(''); }, [value]);

  const select = (s: any) => {
    const label = `${s.firstName || ''} ${s.lastName || ''}`.trim() + ` — ${s.currentGrade || ''}${s.currentSection ? ' ' + s.currentSection : ''}`;
    setSelectedLabel(label);
    setQuery('');
    setOpen(false);
    onChange(s._id, s);
  };

  const clear = () => {
    setSelectedLabel('');
    setQuery('');
    setGrade('');
    setSection('');
    onChange('', undefined);
  };

  if (value && selectedLabel) {
    return (
      <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-white">
        <span className="text-gray-700 truncate">{selectedLabel}</span>
        {!disabled && <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2"><X size={13} /></button>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        <select
          value={grade}
          disabled={disabled}
          onChange={e => { setGrade(e.target.value); setOpen(true); }}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:bg-gray-50"
        >
          <option value="">All Classes</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={section}
          disabled={disabled}
          onChange={e => { setSection(e.target.value); setOpen(true); }}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:bg-gray-50"
        >
          <option value="">All Sections</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C447C] disabled:bg-gray-50"
        />
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      {open && !value && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {!hasFilter ? (
            <div className="px-3 py-2 text-xs text-gray-400">Pick a class/section, or type at least 2 letters of a name or GR No</div>
          ) : isLoading ? (
            <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>
          ) : students.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No matching students found</div>
          ) : (
            students.map((s: any) => (
              <button
                key={s._id}
                type="button"
                onClick={() => select(s)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <span className="font-medium text-gray-700">{s.firstName} {s.lastName}</span>
                <span className="text-gray-400"> — {s.currentGrade}{s.currentSection ? ` ${s.currentSection}` : ''} · {s.admissionNumber}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
