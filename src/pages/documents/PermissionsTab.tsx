import { Card, CardHeader, Btn, PERMISSIONS } from "./shared";

const ROLES = ["Super Admin", "Campus Admin", "Principal", "HR Manager", "Acad. Coord.", "Finance", "Teacher", "Parent", "Student"];
const PERM_LABELS = ["View", "Download", "Upload", "Delete", "Share"];

const roleKeys: (keyof typeof PERMISSIONS[0])[] = ["superAdmin", "campusAdmin", "principal", "hrManager", "acadCoord", "finance", "teacher", "parent", "student"];

const CheckCell = ({ allowed }: { allowed: boolean }) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mx-auto ${allowed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-300"}`}>
    {allowed ? "✓" : "×"}
  </div>
);

export default function PermissionsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Permissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Role-based access control for document categories</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm">📋 Export Matrix</Btn>
          <Btn variant="primary" size="sm">✏️ Edit Permissions</Btn>
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-5">
        {ROLES.map((role, i) => {
          const colors = [
            ["bg-red-100 text-red-800", "bg-red-500"],
            ["bg-purple-100 text-purple-800", "bg-purple-500"],
            ["bg-[#0C447C]/10 text-[#0C447C]", "bg-[#0C447C]"],
            ["bg-emerald-100 text-emerald-800", "bg-emerald-500"],
            ["bg-blue-100 text-blue-800", "bg-blue-500"],
            ["bg-amber-100 text-amber-800", "bg-amber-500"],
            ["bg-teal-100 text-teal-800", "bg-teal-500"],
            ["bg-pink-100 text-pink-800", "bg-pink-500"],
            ["bg-slate-100 text-slate-600", "bg-slate-400"],
          ];
          return (
            <div key={role} className={`rounded-xl p-3 text-center ${colors[i][0]}`}>
              <div className={`w-7 h-7 rounded-full ${colors[i][1]} text-white text-xs font-bold flex items-center justify-center mx-auto mb-1`}>
                {role.charAt(0)}
              </div>
              <div className="text-xs font-semibold leading-tight">{role}</div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      {PERMISSIONS.map((cat) => (
        <Card key={cat.category} className="mb-4">
          <CardHeader
            title={cat.category}
            actions={<Btn variant="ghost" size="xs">Edit →</Btn>}
          />
          <div className="overflow-x-auto p-4">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-semibold text-slate-600 pb-2 w-28">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="text-center font-semibold text-slate-600 pb-2 px-2 min-w-[72px]">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {PERM_LABELS.map((perm, pi) => (
                  <tr key={perm} className="hover:bg-slate-50">
                    <td className="py-2 font-semibold text-slate-700">{perm}</td>
                    {roleKeys.map((rk) => (
                      <td key={rk} className="py-2 px-2 text-center">
                        <CheckCell allowed={(cat[rk] as boolean[])[pi]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">✓</span> Allowed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center text-xs">×</span> Not allowed
        </span>
        <span className="ml-auto text-slate-400">Changes to permissions require Super Admin approval</span>
      </div>
    </div>
  );
}
