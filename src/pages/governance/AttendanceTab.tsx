import { useState } from "react";
import toast from "react-hot-toast";
import {
  useAttendanceSettings, useUpdateAttendanceSettings, useAttendanceCompliance,
} from "../../hooks/useCompliance";
import { Card, CardHeader, KPICard, Btn, TableWrap, Td } from "./shared";

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SettingsPanel() {
  const { data: settings, isLoading } = useAttendanceSettings();
  const updateSettings = useUpdateAttendanceSettings();
  const [minStudent, setMinStudent] = useState<number | null>(null);
  const [minStaff, setMinStaff] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  if (isLoading || !settings) return null;

  const studentVal = minStudent ?? settings.minStudentAttendancePercent;
  const staffVal = minStaff ?? settings.minStaffAttendancePercent;

  const save = () => {
    updateSettings.mutate({
      minStudentAttendancePercent: studentVal,
      minStaffAttendancePercent: staffVal,
    }, {
      onSuccess: () => { toast.success("Thresholds updated"); setEditing(false); setMinStudent(null); setMinStaff(null); },
      onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update thresholds"),
    });
  };

  return (
    <Card className="mb-5">
      <CardHeader
        title="Compliance Thresholds"
        subtitle="Statutory / institutional minimum attendance rates for this school"
        actions={editing
          ? <>
              <Btn size="sm" variant="secondary" onClick={() => { setEditing(false); setMinStudent(null); setMinStaff(null); }}>Cancel</Btn>
              <Btn size="sm" onClick={save}>{updateSettings.isPending ? "Saving…" : "Save"}</Btn>
            </>
          : <Btn size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit Thresholds</Btn>}
      />
      <div className="p-5 grid grid-cols-2 gap-6 max-w-lg">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Min. Student Attendance %</label>
          {editing ? (
            <input type="number" min={0} max={100} value={studentVal} onChange={e => setMinStudent(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          ) : (
            <div className="text-2xl font-bold text-slate-800">{settings.minStudentAttendancePercent}%</div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Min. Staff Attendance %</label>
          {editing ? (
            <input type="number" min={0} max={100} value={staffVal} onChange={e => setMinStaff(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          ) : (
            <div className="text-2xl font-bold text-slate-800">{settings.minStaffAttendancePercent}%</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function BelowThresholdTable({ rows, kind }: { rows: any[]; kind: "Student" | "Staff" }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No {kind.toLowerCase()}s below the threshold in this period.</p>;
  }
  return (
    <TableWrap headers={[kind, "Campus", "Attendance Rate", "Absences", "Days Counted"]}>
      {rows.map((r: any) => (
        <tr key={r.id}>
          <Td className="font-medium text-slate-800">{r.name}</Td>
          <Td>{r.campusName}</Td>
          <Td><span className="font-semibold text-red-600">{r.ratePercent}%</span></Td>
          <Td>{r.absences}</Td>
          <Td>{r.daysCounted}</Td>
        </tr>
      ))}
    </TableWrap>
  );
}

function CampusBreakdownTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) return null;
  return (
    <TableWrap headers={["Campus", "Attendance Rate", "With Data", "Below Threshold"]}>
      {rows.map((r: any) => (
        <tr key={r.campusId ?? "unassigned"}>
          <Td className="font-medium text-slate-800">{r.campusName}</Td>
          <Td>{r.ratePercent != null ? `${r.ratePercent}%` : "—"}</Td>
          <Td>{r.totalWithData}</Td>
          <Td>{r.belowThresholdCount > 0
            ? <span className="text-red-600 font-semibold">{r.belowThresholdCount}</span>
            : <span className="text-emerald-600">0</span>}
          </Td>
        </tr>
      ))}
    </TableWrap>
  );
}

export default function AttendanceTab() {
  const [tab, setTab] = useState<"students" | "staff">("students");
  const { data, isLoading } = useAttendanceCompliance();

  const students = data?.students ?? { overallRatePercent: null, totalWithData: 0, belowThresholdCount: 0, belowThreshold: [], campusBreakdown: [] };
  const staff = data?.staff ?? { overallRatePercent: null, totalWithData: 0, belowThresholdCount: 0, belowThreshold: [], campusBreakdown: [] };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Attendance Compliance</h1>
        <p className="text-sm text-slate-500 mt-0.5">Student and staff attendance monitoring against statutory and institutional thresholds</p>
      </div>

      <SettingsPanel />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.hasTenant ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">🛡️</div>
          <p className="text-sm font-semibold text-gray-500">No attendance records yet</p>
          <p className="text-xs text-gray-400 mt-1">This section will populate once configured</p>
        </div>
      ) : (
        <>
          {data?.window && (
            <p className="text-xs text-slate-400 mb-4">
              Showing {fmtDate(data.window.from)} – {fmtDate(data.window.to)}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <KPICard label="Overall Student Rate" value={students.overallRatePercent != null ? `${students.overallRatePercent}%` : "No data"} color="navy" />
            <KPICard label="Students Below Threshold" value={String(students.belowThresholdCount)} color={students.belowThresholdCount > 0 ? "red" : "green"} />
            <KPICard label="Overall Staff Rate" value={staff.overallRatePercent != null ? `${staff.overallRatePercent}%` : "No data"} color="blue" />
            <KPICard label="Staff Below Threshold" value={String(staff.belowThresholdCount)} color={staff.belowThresholdCount > 0 ? "red" : "green"} />
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab("students")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "students" ? "bg-[#0C447C] text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              Students ({students.totalWithData})
            </button>
            <button onClick={() => setTab("staff")} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === "staff" ? "bg-[#0C447C] text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              Staff ({staff.totalWithData})
            </button>
          </div>

          <Card className="mb-5">
            <CardHeader title={`Campus Breakdown — ${tab === "students" ? "Students" : "Staff"}`} />
            <div className="p-2">
              <CampusBreakdownTable rows={tab === "students" ? students.campusBreakdown : staff.campusBreakdown} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title={`Below Threshold — ${tab === "students" ? "Students" : "Staff"}`}
              subtitle={`Falling below the configured minimum attendance rate`}
            />
            <div className="p-2">
              <BelowThresholdTable rows={tab === "students" ? students.belowThreshold : staff.belowThreshold} kind={tab === "students" ? "Student" : "Staff"} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
