import { useState } from "react";
import { Card, CardHeader, Btn, Badge, Modal, FormField, FInput, FSelect, TableWrap, Td, ROLES, USERS } from "./shared";

export default function RBACTab() {
  const [roleModal, setRoleModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);

  const perms = ["view", "create", "edit", "del", "approve", "export", "assign", "lock"] as const;
  const permLabels = ["View", "Create", "Edit", "Delete", "Approve", "Export", "Assign", "Lock"];

  const roleBadge: Record<string, string> = {
    Principal: "bg-purple-50 text-purple-700",
    "Compliance Officer": "bg-blue-50 text-blue-700",
    Teacher: "bg-amber-50 text-amber-700",
    "HR Officer": "bg-slate-100 text-slate-600",
    Auditor: "bg-teal-50 text-teal-700",
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Role-Based Access Control</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage roles, permissions, and user access across all campuses</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Roles",          value: "12", sub: "4 privileged · 8 standard", color: "red" },
          { label: "Active Users",         value: "142", sub: "Across all campuses",       color: "blue" },
          { label: "Pending Assignments",  value: "8",  sub: "Awaiting approval",          color: "amber" },
          { label: "Privileged Accounts",  value: "6",  sub: "Super Admin, Owner, Principal", color: "navy" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{k.label}</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
            {k.sub && <div className="text-xs text-slate-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card className="mb-4">
        <CardHeader
          title="Permission Matrix"
          subtitle="Module-level permission settings for each role"
          actions={
            <div className="flex gap-2">
              <Btn variant="primary" size="sm" onClick={() => setRoleModal(true)}>+ Add Role</Btn>
              <Btn variant="secondary" size="sm">📤 Export</Btn>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wide min-w-[160px] sticky left-0 bg-slate-50 z-10">Role</th>
                {permLabels.map((l) => <th key={l} className="py-2.5 px-3 font-semibold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">{l}</th>)}
                <th className="py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wide text-center">Users</th>
                <th className="py-2.5 px-4 font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ROLES.map((r) => (
                <tr key={r.name} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100">{r.name}</td>
                  {perms.map((p) => (
                    <td key={p} className="py-2.5 px-3 text-center">
                      {r[p]
                        ? <span className="text-emerald-500 font-bold text-base">✓</span>
                        : <span className="text-slate-200 text-base">✗</span>}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-center">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{r.users}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <Btn variant="secondary" size="xs">Edit</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Assignments */}
      <Card>
        <CardHeader
          title="User Role Assignments"
          actions={<Btn variant="primary" size="sm" onClick={() => setAssignModal(true)}>+ Assign Role</Btn>}
        />
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100">
          <input placeholder="🔍 Search users…" className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C] w-44" />
          <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
            {["All Roles", "Super Admin", "Principal", "Teacher", "HR Officer", "Auditor"].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none">
            {["All Campuses", "Main Campus", "Boys Campus", "Girls Campus", "Riverside"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <TableWrap headers={["User", "Role", "Campus", "Last Login", "Status", "Actions"]}>
          {USERS.map((u) => (
            <tr key={u.email} className="hover:bg-slate-50">
              <Td>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: u.bg, color: u.color }}>{u.initials}</div>
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </div>
                </div>
              </Td>
              <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded ${roleBadge[u.role] ?? "bg-slate-100 text-slate-600"}`}>{u.role}</span></Td>
              <Td className="text-xs text-slate-600">{u.campus}</Td>
              <Td className="text-xs text-slate-400">{u.login}</Td>
              <Td><Badge status={u.status} /></Td>
              <Td>
                {u.status === "Active"
                  ? <Btn variant="secondary" size="xs">Manage</Btn>
                  : <Btn variant="danger" size="xs">Revoke</Btn>}
              </Td>
            </tr>
          ))}
        </TableWrap>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <span className="text-xs text-slate-500">Showing 5 of 142 users</span>
          <div className="flex gap-1">
            {["←", "1", "2", "3", "→"].map((p) => (
              <button key={p} className={`min-w-[28px] h-7 rounded border text-xs font-medium ${p === "1" ? "bg-[#0C447C] text-white border-[#0C447C]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>

      {/* Add Role Modal */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Add New Role">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
          ⚠️ New roles with sensitive permissions require Super Admin approval before activation.
        </div>
        <FormField label="Role Name" required><FInput placeholder="e.g. Library Manager" /></FormField>
        <FormField label="Description"><textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none resize-none h-20" placeholder="Describe the role responsibilities…" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Campus Access"><FSelect options={["All Campuses", "Specific Campus"]} /></FormField>
          <FormField label="Access Level"><FSelect options={["Standard", "Elevated", "Admin"]} /></FormField>
        </div>
        <FormField label="Initial Permissions">
          <div className="flex flex-wrap gap-3 mt-1">
            {["View", "Create", "Edit", "Delete", "Approve", "Export"].map((p) => (
              <label key={p} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" defaultChecked={p === "View"} className="accent-[#0C447C]" /> {p}
              </label>
            ))}
          </div>
        </FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
          <Btn variant="secondary" onClick={() => setRoleModal(false)}>Cancel</Btn>
          <Btn variant="primary">Create Role</Btn>
        </div>
      </Modal>

      {/* Assign Role Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Role to User">
        <FormField label="Search User" required><FInput placeholder="Type name or email…" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Assign Role" required>
            <FSelect options={["Select role…", "Super Admin", "Principal", "Campus Head", "Teacher", "HR Officer", "Auditor", "Viewer"]} />
          </FormField>
          <FormField label="Campus Access" required>
            <FSelect options={["All Campuses", "Main Campus", "Boys Campus", "Girls Campus", "Riverside Branch"]} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Effective From"><FInput type="date" defaultValue="2026-05-14" /></FormField>
          <FormField label="Expires On (optional)"><FInput type="date" /></FormField>
        </div>
        <FormField label="Notes"><textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none resize-none h-16" placeholder="Reason for role assignment…" /></FormField>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
          <Btn variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Btn>
          <Btn variant="primary">Assign Role & Notify</Btn>
        </div>
      </Modal>
    </div>
  );
}
