// recharts imported but not used currently — remove to avoid confusion
import { Card, CardHeader, KPICard, Badge, Btn } from "./shared";
import { useDocsDashboard, useMyApprovals } from "../../hooks/useDocuments";
import { EmptyState } from "../../components/ui/EmptyState";
import { FileText, CheckSquare, Clock, Activity } from "lucide-react";

export default function DashboardTab() {
  const { data: dashData } = useDocsDashboard();
  const { data: approvalsData } = useMyApprovals();

  const stats = (dashData as any)?.stats ?? {};
  const approvals: any[] = (approvalsData as any)?.data ?? [];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Documents & Workflow Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">System-wide overview — documents, approvals, workflows, and tasks</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <KPICard icon="📄" label="Total Documents"    value={stats.totalDocuments    ?? 0} sub="All campuses"      color="navy"   />
        <KPICard icon="⏳" label="Pending Approvals"  value={stats.pendingApprovals  ?? approvals.length} sub="Awaiting action" color="amber"  />
        <KPICard icon="⚠️" label="Expiring Soon"      value={stats.expiringSoon      ?? 0} sub="Next 30 days"     color="red"    />
        <KPICard icon="🔄" label="Active Workflows"   value={stats.activeWorkflows   ?? 0} sub="In progress"      color="blue"   />
        <KPICard icon="✍️" label="Awaiting Signature" value={stats.awaitingSignature ?? 0} sub="Pending e-sign"   color="orange" />
        <KPICard icon="📋" label="Overdue Tasks"      value={stats.overdueTasks      ?? 0} sub="Past due date"    color="red"    />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader title="Recent Activity" actions={<Btn variant="ghost" size="sm">View All</Btn>} />
          <EmptyState
            icon={<Activity size={24} />}
            title="No recent activity"
            description="Document activity will appear here once users start uploading and reviewing documents."
          />
        </Card>

        {/* Pending Approvals Queue */}
        <Card className="lg:col-span-2">
          <CardHeader title="Pending Approvals Queue" actions={<Btn variant="primary" size="sm">View All</Btn>} />
          {approvals.length === 0 ? (
            <EmptyState
              icon={<CheckSquare size={24} />}
              title="No pending approvals"
              description="All documents are up to date. Pending approvals will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {approvals.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-blue-100 text-blue-700">
                    {a.requestorName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{a.title || a.documentTitle}</div>
                    <div className="text-xs text-slate-500">{a.requestorDept || a.department}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge status={a.priority || 'Medium'} />
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Btn variant="success" size="xs">✓</Btn>
                    <Btn variant="secondary" size="xs">→</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Expiry Alerts */}
        <Card>
          <CardHeader title="Expiry Alerts" />
          <EmptyState
            icon={<Clock size={24} />}
            title="No expiry alerts"
            description="Document expiry alerts will appear here when documents are near their renewal date."
          />
        </Card>

        {/* Workflow Overview */}
        <Card>
          <CardHeader title="Active Workflow Progress" />
          <EmptyState
            icon={<FileText size={24} />}
            title="No active workflows"
            description="Active document workflows and their progress will be shown here."
          />
        </Card>

        {/* Documents by Category */}
        <Card>
          <CardHeader title="Documents by Category" />
          <EmptyState
            icon={<FileText size={24} />}
            title="No documents yet"
            description="Document category breakdown will appear once documents are uploaded."
          />
        </Card>
      </div>

      {/* Monthly Uploads Chart */}
      <Card>
        <CardHeader title="Monthly Document Uploads" subtitle="Upload activity over time" />
        <div className="p-8 flex items-center justify-center">
          <EmptyState
            icon={<Activity size={32} />}
            title="No upload data yet"
            description="Monthly upload statistics will appear here as documents are added to the system."
          />
        </div>
      </Card>
    </div>
  );
}
