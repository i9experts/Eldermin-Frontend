import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';

interface Props {
  value: string;
  onChange: (studentId: string, student?: any) => void;
  placeholder?: string;
  disabled?: boolean;
}

// A plain <select> can't reasonably hold every active student at a real
// school (Deenway alone has ~179) — the backend also hard-caps any single
// page at 100 regardless, so a dropdown trying to load "all of them" would
// silently cut off real students past that limit. This searches by name/
// GR No/guardian phone instead, matching the same search the backend
// already supports for the main Student Directory.
export const StudentSelect: React.FC<Props> = ({ value, onChange, placeholder = 'Search student by name or GR No…', disabled }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: studentsData, isLoading } = useStudents({
    status: 'active', limit: 20,
    search: query.trim().length >= 2 ? query.trim() : undefined,
  });
  const students = studentsData?.data ?? [];

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
    onChange('', undefined);
  };

  return (
    <div ref={containerRef} className="relative">
      {value && selectedLabel ? (
        <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between bg-white">
          <span className="text-gray-700 truncate">{selectedLabel}</span>
          {!disabled && <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2"><X size={13} /></button>}
        </div>
      ) : (
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
      )}

      {open && !value && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-gray-400">Searching…</div>
          ) : students.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">
              {query.trim().length >= 2 ? 'No matching students found' : 'Type at least 2 letters of a name or GR No'}
            </div>
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
