import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Badge, Btn, Card, FInput, FSelect, FormField, Modal, PageHeader, SearchBar, TableWrapper,
} from "./shared";
import organizationService from "../../services/organization.service";
import { useStaffList } from "../../hooks/useStaffList";

const NO_STAFF = "-- Select Staff --";
const EMPTY_FORM = {
  delegatorName: NO_STAFF, delegatorRole: "",
  delegateName: NO_STAFF, delegateRole: "",
  scope: "", reason: "", startDate: "", endDate: "",
};

export default function DelegationsTab({ initialModal = false }: { initialModal?: boolean }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(initialModal);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { data: delegations = [], isLoading } = useQuery({
    queryKey: ["delegations"],
    queryFn: organizationService.getDelegations,
  });
  const { data: staff = [] } = useStaffList();

  const staffOptions = [NO_STAFF, ...(staff as any[]).map((s: any) => `${s.firstName || ""} ${s.lastName || ""}`.trim()).filter(Boolean)];

  const createDelegation = useMutation({
    mutationFn: organizationService.createDelegation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      toast.success("Delegation created");
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create delegation"),
  });

  const revokeDelegation = useMutation({
    mutationFn: (id: string) => organizationService.revokeDelegation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      toast.success("Delegation revoked");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to revoke"),
  });

  const filtered = (delegations as any[]).filter((d) =>
    d.delegatorName.toLowerCase().includes(search.toLowerCase()) ||
    d.delegateName.toLowerCase().includes(search.toLowerCase()) ||
    (d.scope || "").toLowerCase().includes(search.toLowerCase())
  );

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (form.delegatorName === NO_STAFF) e.delegatorName = "Select who is delegating";
    if (form.delegateName === NO_STAFF) e.delegateName = "Select who is receiving authority";
    if (form.delegatorName !== NO_STAFF && form.delegatorName === form.delegateName) e.delegateName = "Can't delegate to the same person";
    if (!form.scope.trim()) e.scope = "Scope is required (e.g. 'All Approvals', 'Finance')";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) e.endDate = "End date must be after start date";
    return e;
  }

  function handleSave() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      createDelegation.mutate({
        delegatorName: form.delegatorName,
        delegatorRole: form.delegatorRole || undefined,
        delegateName: form.delegateName,
        delegateRole: form.delegateRole || undefined,
        scope: form.scope,
        reason: form.reason || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
      });
    }
  }

  function handleClose() {
    setModal(false);
    setForm({ ...EMPTY_FORM });
    setErrors({});
  }

  function statusBadge(d: any) {
    if (d.computedStatus === "revoked") return <Badge status="Inactive" />;
    if (d.computedStatus === "expired") return <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Expired</span>;
    return <Badge status="Active" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={["Home", "Institution Setup", "Authority Delegation"]}
        title="Authority Delegation"
        subtitle={`${(delegations as any[]).length} delegation${(delegations as any[]).length !== 1 ? "s" : ""} recorded`}
        actions={<Btn variant="primary" size="sm" onClick={() => setModal(true)}>＋ Delegate Authority</Btn>}
      />

      <Card className="p-4">
        <SearchBar placeholder="Search by name or scope…" value={search} onChange={setSearch} />
      </Card>

      <Card>
        <TableWrapper headers={["Delegator", "Delegate", "Scope", "Reason", "Period", "Status", "Actions"]}>
          {filtered.map((d: any) => (
            <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-4 text-sm">
                <p className="font-semibold text-slate-800">{d.delegatorName}</p>
                {d.delegatorRole && <p className="text-xs text-slate-400">{d.delegatorRole}</p>}
              </td>
              <td className="py-3 px-4 text-sm">
                <p className="font-semibold text-slate-800">{d.delegateName}</p>
                {d.delegateRole && <p className="text-xs text-slate-400">{d.delegateRole}</p>}
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">{d.scope}</td>
              <td className="py-3 px-4 text-xs text-slate-500">{d.reason || "—"}</td>
              <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                {new Date(d.startDate).toLocaleDateString()} – {new Date(d.endDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">{statusBadge(d)}</td>
              <td className="py-3 px-4">
                {d.computedStatus === "active" && (
                  <button
                    onClick={() => { if (window.confirm(`Revoke ${d.delegatorName} → ${d.delegateName}'s delegation now?`)) revokeDelegation.mutate(d._id); }}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg font-medium"
                  >Revoke</button>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                {(delegations as any[]).length === 0
                  ? "No delegations recorded yet. Click ＋ Delegate Authority when someone needs to temporarily hand off approval authority (e.g. while on leave)."
                  : "No results match your search."}
              </td>
            </tr>
          )}
        </TableWrapper>
      </Card>

      <Modal open={modal} onClose={handleClose} title="Delegate Authority" size="md">
        <div className="p-5 grid grid-cols-2 gap-4">
          <FormField label="Delegator (handing off authority)" required>
            <FSelect options={staffOptions} value={form.delegatorName} onChange={(e) => setField("delegatorName", e.target.value)} />
            {errors.delegatorName && <p className="text-xs text-red-500 mt-1">{errors.delegatorName}</p>}
          </FormField>
          <FormField label="Delegator's Role">
            <FInput value={form.delegatorRole} onChange={(e) => setField("delegatorRole", e.target.value)} placeholder="e.g. Principal" />
          </FormField>
          <FormField label="Delegate (receiving authority)" required>
            <FSelect options={staffOptions} value={form.delegateName} onChange={(e) => setField("delegateName", e.target.value)} />
            {errors.delegateName && <p className="text-xs text-red-500 mt-1">{errors.delegateName}</p>}
          </FormField>
          <FormField label="Delegate's Role">
            <FInput value={form.delegateRole} onChange={(e) => setField("delegateRole", e.target.value)} placeholder="e.g. Vice Principal" />
          </FormField>
          <div className="col-span-2">
            <FormField label="Scope of Authority" required>
              <FInput value={form.scope} onChange={(e) => setField("scope", e.target.value)} placeholder="e.g. All Approvals, Finance, HR" />
              {errors.scope && <p className="text-xs text-red-500 mt-1">{errors.scope}</p>}
            </FormField>
          </div>
          <div className="col-span-2">
            <FormField label="Reason">
              <FInput value={form.reason} onChange={(e) => setField("reason", e.target.value)} placeholder="e.g. Annual Leave, Hajj/Umrah, Travel" />
            </FormField>
          </div>
          <FormField label="Start Date" required>
            <FInput type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </FormField>
          <FormField label="End Date" required>
            <FInput type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </FormField>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="secondary" onClick={handleClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSave}>
            {createDelegation.isPending ? "Saving…" : "＋ Delegate Authority"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
