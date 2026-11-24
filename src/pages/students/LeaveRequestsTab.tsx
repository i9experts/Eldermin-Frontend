// ============================================================
// STUDENT LEAVE REQUESTS — admin review
// Parents submit a leave request from the parent app for their child's
// absence. Any school admin (not just the student's class teacher, who
// reviews these separately in the Teacher app) can approve or reject
// here.
// ============================================================

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarOff, Check, X } from 'lucide-react'
import * as studentsApi from '../../services/students.api'
import type { StudentLeaveRequest } from '../../services/students.api'

const STATUS_TABS: { id: '' | 'pending' | 'approved' | 'rejected'; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: '', label: 'All' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  sick: 'Sick', family: 'Family', travel: 'Travel', other: 'Other',
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function ReviewModal({ leave, status, onClose }: { leave: StudentLeaveRequest; status: 'approved' | 'rejected'; onClose: () => void }) {
  const [remarks, setRemarks] = useState('')
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => studentsApi.reviewLeaveRequest(leave._id, { status, remarks: remarks.trim() || undefined }),
    onSuccess: () => {
      toast.success(status === 'approved' ? 'Leave request approved' : 'Leave request rejected')
      qc.invalidateQueries({ queryKey: ['students', 'leave-requests'] })
      onClose()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not save the decision'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            {status === 'approved' ? 'Approve' : 'Reject'} leave request
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {leave.studentName} · {fmtDate(leave.fromDate)} – {fmtDate(leave.toDate)}
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{leave.reason}</div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Remarks {status === 'rejected' ? '(reason for the parent)' : '(optional)'}
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#0C447C]"
              placeholder={status === 'approved' ? 'e.g. Get well soon' : 'e.g. Please submit a doctor\'s note on return'}
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className={`px-4 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-60 ${
              status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mut.isPending ? 'Saving…' : status === 'approved' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LeaveRequestsTab() {
  const [status, setStatus] = useState<'' | 'pending' | 'approved' | 'rejected'>('pending')
  const [reviewing, setReviewing] = useState<{ leave: StudentLeaveRequest; status: 'approved' | 'rejected' } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['students', 'leave-requests', status],
    queryFn: () => studentsApi.fetchLeaveRequests(status || undefined),
  })
  const rows = data?.items ?? []

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">Leave Requests</h2>
        <p className="text-xs text-gray-400">Student absence requests submitted by parents. Any admin can review these — a class-teacher link is not required.</p>
      </div>

      <div className="flex gap-1 bg-gray-50 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              status === t.id ? 'bg-white text-[#0C447C] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center">
            <CalendarOff size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No {status || ''} leave requests.</p>
          </div>
        )}
        <div className="divide-y divide-gray-50">
          {rows.map((leave) => (
            <div key={leave._id} className="flex items-start justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-800">{leave.studentName}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_BADGE[leave.status]}`}>
                    {leave.status}
                  </span>
                  <span className="text-[10px] text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                    {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{fmtDate(leave.fromDate)} – {fmtDate(leave.toDate)}</p>
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{leave.reason}</p>
                <p className="text-[11px] text-gray-400 mt-1">Requested by {leave.requestedByName}</p>
                {leave.status !== 'pending' && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {leave.status === 'approved' ? 'Approved' : 'Rejected'} by {leave.approverName || 'Admin'}
                    {leave.approverNote ? `: ${leave.approverNote}` : ''}
                  </p>
                )}
              </div>
              {leave.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setReviewing({ leave, status: 'approved' })}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => setReviewing({ leave, status: 'rejected' })}
                    className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {reviewing && (
        <ReviewModal leave={reviewing.leave} status={reviewing.status} onClose={() => setReviewing(null)} />
      )}
    </div>
  )
}
