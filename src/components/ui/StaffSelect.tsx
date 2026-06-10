import React from 'react';
import { useStaffList } from '../../hooks/useStaffList';

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

export const StaffSelect: React.FC<Props> = ({ placeholder = 'Select Staff', ...props }) => {
  const { data: staff, isLoading } = useStaffList();
  return (
    <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none text-gray-600 disabled:bg-gray-50">
      <option value="">{isLoading ? 'Loading staff...' : placeholder}</option>
      {(staff || []).map((s: any) => (
        <option key={s._id} value={s._id}>
          {s.firstName} {s.lastName} — {s.designation || s.role || ''}
        </option>
      ))}
      {!isLoading && (!staff || staff.length === 0) && (
        <option disabled>No staff enrolled yet</option>
      )}
    </select>
  );
};
