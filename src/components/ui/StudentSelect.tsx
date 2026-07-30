import React from 'react';
import { useStudents } from '../../hooks/useStudents';

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export const StudentSelect: React.FC<Props> = ({ placeholder = 'Select Student', ...props }) => {
  const { data: studentsData, isLoading } = useStudents({ status: 'active', limit: 200 });
  const students = studentsData?.data ?? [];
  return (
    <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-gray-600 disabled:bg-gray-50">
      <option value="">{isLoading ? 'Loading students...' : placeholder}</option>
      {students.map((s: any) => (
        <option key={s._id} value={s._id}>
          {s.firstName} {s.lastName} — {s.currentGrade}{s.currentSection ? ` ${s.currentSection}` : ''}
        </option>
      ))}
      {!isLoading && students.length === 0 && (
        <option disabled>No active students enrolled yet</option>
      )}
    </select>
  );
};
