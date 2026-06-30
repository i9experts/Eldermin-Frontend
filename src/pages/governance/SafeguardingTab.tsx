import { useSafeguarding } from "../../hooks/useCompliance";

export default function SafeguardingTab() {
  const { data: rawCases = [], isLoading } = useSafeguarding();
  const cases: any[] = Array.isArray(rawCases) ? rawCases : ((rawCases as any)?.data ?? []);

  return (
    <div>
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
        <span className="text-base">🔒</span>
        <span className="text-xs font-semibold text-red-800">
          RESTRICTED — Child safeguarding data is strictly confidential. All access is logged and monitored. Authorised personnel only.
        </span>
      </div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Child Safeguarding Compliance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Incident reporting, case tracking, staff verification and safeguarding compliance</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">🛡️</div>
          <p className="text-sm font-semibold text-gray-500">No safeguarding cases</p>
          <p className="text-xs text-gray-400 mt-1">No records have been added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c: any) => (
            <div key={c._id ?? c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-slate-800">{c.title ?? c.caseRef ?? c.type}</div>
                {c.status && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{c.status}</span>
                )}
              </div>
              {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
              {c.createdAt && (
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
