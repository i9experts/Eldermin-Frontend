import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ScrollText, Stethoscope } from 'lucide-react';
import * as saApi from '../../services/super-admin.api';
import { BtnPrimary, BtnSecondary } from './shared';

function ClassSectionRepairPanel() {
  const [report, setReport] = useState<any | null>(null);
  const [applied, setApplied] = useState<any | null>(null);

  const preview = useMutation({
    mutationFn: saApi.previewClassSectionRepairAllSchools,
    onSuccess: (r: any) => { setReport(r); setApplied(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to check schools'),
  });

  const apply = useMutation({
    mutationFn: saApi.applyClassSectionRepairAllSchools,
    onSuccess: (r: any) => {
      setApplied(r);
      toast.success(`Fixed ${r.totalFixed} student record(s) across ${r.schoolsProcessed} school(s)`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to apply fix'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><Stethoscope size={16} className="text-amber-600" /></div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Class/Section Data Repair — All Schools</p>
          <p className="text-xs text-gray-400 mt-0.5">
            A student's class/section is free text with no link to the real Grade/Section list, so it
            can drift (a typo, different casing, a full class label typed into the wrong field) — the
            usual symptom reported is a class teacher's own Attendance register showing no students at
            all for a class that clearly has them. Runs across every active school at once.
          </p>
        </div>
      </div>

      {!report ? (
        <BtnSecondary onClick={() => preview.mutate()} disabled={preview.isPending}>
          {preview.isPending ? 'Checking every school…' : 'Check All Schools'}
        </BtnSecondary>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-gray-800">{report.schoolsChecked}</p>
              <p className="text-[10px] text-gray-400 uppercase">Schools Checked</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-700">{report.schoolsWithFixes}</p>
              <p className="text-[10px] text-amber-600 uppercase">Schools Affected</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-700">{report.totalFixed}</p>
              <p className="text-[10px] text-amber-600 uppercase">Can Be Fixed</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-red-700">{report.totalUnresolved}</p>
              <p className="text-[10px] text-red-600 uppercase">Need Manual Review</p>
            </div>
          </div>

          {applied ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 font-medium">
              ✓ Fixed {applied.totalFixed} student record(s) across {applied.schoolsProcessed} school(s).
              {applied.totalUnresolved > 0 && ` ${applied.totalUnresolved} still need manual review.`}
            </div>
          ) : report.bySchool.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">No drifted records found on any school.</p>
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {report.bySchool.map((s: any) => (
                  <div key={s.schoolSlug} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-700">{s.schoolSlug}</span>
                    <span className="text-gray-500">{s.fixedCount} fixable · {s.unresolvedCount} need review</span>
                  </div>
                ))}
              </div>
              {report.totalFixed > 0 && (
                <BtnPrimary onClick={() => apply.mutate()} disabled={apply.isPending}>
                  {apply.isPending ? 'Applying…' : `Apply Fix Across ${report.schoolsWithFixes} School(s)`}
                </BtnPrimary>
              )}
            </>
          )}

          <button onClick={() => preview.mutate()} disabled={preview.isPending} className="text-xs text-gray-400 hover:text-gray-600">
            Re-check
          </button>
        </div>
      )}
    </div>
  );
}

export default function AuditTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Audit Logs & Settings</h2>
        <p className="text-xs text-gray-400">Every super-admin action, logged</p>
      </div>

      <ClassSectionRepairPanel />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center">
        <ScrollText size={32} className="text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-600 mb-1">Audit log — coming soon</p>
        <p className="text-xs text-gray-400 max-w-sm">
          A record of who activated/suspended a school, changed a plan, or modified a role — plus
          platform-wide settings like email templates and integration keys. Not built yet.
        </p>
      </div>
    </div>
  );
}
