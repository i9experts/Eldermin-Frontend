// ============================================================
// PARENT APP ACCESS — admin dashboard of restricted parents
// Lists every parent-student link with at least one "premium" app
// feature currently suspended (fee default, uncooperative conduct,
// etc.), campus-scoped. Managing an individual restriction happens on
// that student's own profile (Guardians tab), this is just the overview.
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldOff, ExternalLink } from 'lucide-react'
import { CampusDropdown } from '../teaching/tabs/shared'
import parentAccessControlService, { PARENT_FEATURE_LABELS } from '../../services/parentAccessControl.service'

export default function RestrictedParentsTab() {
  const [campusId, setCampusId] = useState('')

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['parent-access-control', 'restricted', campusId],
    queryFn: () => parentAccessControlService.listRestricted(campusId || undefined),
  })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Parent App Access — Restricted</h2>
        <p className="text-xs text-gray-400">Every parent currently suspended from one or more premium app features on a specific child. Manage each one from that student's Guardians tab.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm max-w-xs">
        <CampusDropdown value={campusId} onChange={setCampusId} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Restricted Parent-Student Links</p>
        </div>
        {isLoading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center">
            <ShieldOff size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No parent currently has a restricted app feature{campusId ? ' in this campus' : ''}.</p>
          </div>
        )}
        <div className="divide-y divide-gray-50">
          {rows.map((r) => (
            <div key={`${r.parentUserId}-${r.studentId}`} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {r.student ? `${r.student.firstName} ${r.student.lastName}` : 'Unknown student'}
                  {r.student?.currentGrade && <span className="text-gray-400 font-normal"> · {r.student.currentGrade}{r.student.currentSection ? `-${r.student.currentSection}` : ''}</span>}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {r.suspendedFeatures.map((f) => PARENT_FEATURE_LABELS[f]).join(', ')}
                </p>
              </div>
              <Link
                to={`/students/${r.studentId}?tab=guardians`}
                className="flex items-center gap-1.5 text-xs text-[#0C447C] font-medium hover:underline shrink-0"
              >
                Manage <ExternalLink size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
