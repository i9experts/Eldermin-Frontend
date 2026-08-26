import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Plus, X, Copy, Star, Trash2, Eye, PencilRuler, CheckCircle, XCircle,
} from "lucide-react";
import * as reportTemplatesApi from "../../services/report-templates.api";
import type { ReportTemplate, ReportType } from "../../services/report-templates.api";
import { REPORT_TYPE_LABELS } from "../../services/report-templates.api";

// ─── LOCAL PRIMITIVES (mirrors src/pages/finance/index.tsx visual language) ───
type BV = "green" | "amber" | "red" | "blue" | "purple" | "gray" | "navy";
const BADGE: Record<BV, string> = {
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray:   "bg-slate-100 text-slate-600 border-slate-200",
  navy:   "bg-[#0C447C] text-white border-[#0C447C]",
};

function Badge({ v, children }: { v: BV; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${BADGE[v]}`}>
      {children}
    </span>
  );
}

function Btn({ children, variant = "secondary", size = "sm", onClick, disabled, title }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md"; onClick?: () => void; disabled?: boolean; title?: string;
}) {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  };
  const s = size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${v[variant]} ${s} border rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Modal({ title, size = "md", onClose, children }: {
  title: string; size?: "md" | "lg"; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${size === "lg" ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
}

function FField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const fInputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent";

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fInputCls} />;
}

function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={fInputCls + " bg-white cursor-pointer"}>{children}</select>;
}

function ModalFooter({ onCancel, onSave, saveLabel = "Save", saving }: { onCancel: () => void; onSave: () => void; saveLabel?: string; saving?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
      <Btn variant="secondary" size="md" onClick={onCancel}>Cancel</Btn>
      <Btn variant="primary" size="md" onClick={onSave} disabled={saving}>{saveLabel}</Btn>
    </div>
  );
}

const REPORT_TYPES: ReportType[] = [
  'fee_receipt', 'payment_voucher', 'journal_voucher', 'expense_voucher',
  'payslip', 'result_card', 'attendance_sheet', 'admission_letter', 'contract', 'custom',
];

// ─── DOCUMENT THUMBNAIL ────────────────────────────────────────────────────────
function TemplateThumbnail({ template }: { template: ReportTemplate }) {
  const primary = template.letterhead?.primaryColor || "#0C447C";
  const accent = template.letterhead?.accentColor || "#EF9F27";
  const bg = template.letterhead?.backgroundColor || "#ffffff";
  return (
    <div className="w-full h-32 rounded-lg border border-slate-200 overflow-hidden flex flex-col" style={{ background: bg }}>
      <div className="h-6 flex items-center gap-1 px-2" style={{ background: primary }}>
        {template.letterhead?.showLogo && <div className="w-3 h-3 rounded-sm bg-white/70" />}
        <div className="h-1.5 flex-1 rounded-full bg-white/60" style={{ maxWidth: 60 }} />
        <div className="h-1.5 w-2 rounded-full" style={{ background: accent }} />
      </div>
      <div className="flex-1 p-2.5 space-y-1.5">
        <div className="h-1.5 w-2/3 rounded-full bg-slate-200" />
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
        <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
        <div className="mt-2 h-1.5 w-1/2 rounded-full" style={{ background: accent, opacity: 0.5 }} />
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
        <div className="h-1.5 w-4/6 rounded-full bg-slate-100" />
      </div>
      <div className="h-3 border-t border-slate-100" />
    </div>
  );
}

// ─── CREATE TEMPLATE MODAL ─────────────────────────────────────────────────────
function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: ReportTemplate) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ReportType>("fee_receipt");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => reportTemplatesApi.createTemplate({ name, type }),
    onSuccess: (created) => {
      toast.success("Template created");
      queryClient.setQueryData(["report-templates"], (old?: ReportTemplate[]) => [...(old || []), created]);
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      onCreated(created);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create template"),
  });

  function save() {
    if (!name.trim()) { toast.error("Enter a template name"); return; }
    createMutation.mutate();
  }

  return (
    <Modal title="Create Report Template" onClose={onClose}>
      <FField label="Template Name" required>
        <FInput placeholder="e.g. Main Campus Fee Receipt" value={name} onChange={e => setName(e.target.value)} />
      </FField>
      <FField label="Template Type" required>
        <FSelect value={type} onChange={e => setType(e.target.value as ReportType)}>
          {REPORT_TYPES.map(t => <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>)}
        </FSelect>
      </FField>
      <ModalFooter onCancel={onClose} onSave={save} saving={createMutation.isPending} saveLabel={createMutation.isPending ? "Creating…" : "Create & Design"} />
    </Modal>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ReportTemplatesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ReportTemplate | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["report-templates"],
    queryFn: reportTemplatesApi.fetchTemplates,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["report-templates"] });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => reportTemplatesApi.setDefaultTemplate(id),
    onSuccess: () => { invalidate(); toast.success("Set as default template"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to set default"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => reportTemplatesApi.duplicateTemplate(id),
    onSuccess: () => { invalidate(); toast.success("Template duplicated"); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to duplicate template"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportTemplatesApi.deleteTemplate(id),
    onSuccess: () => { invalidate(); toast.success("Template deleted"); setConfirmDelete(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete template"),
  });

  const [previewingId, setPreviewingId] = useState<string | null>(null);
  async function handlePreview(id: string) {
    setPreviewingId(id);
    try {
      const url = await reportTemplatesApi.previewTemplate(id);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate preview");
    } finally {
      setPreviewingId(null);
    }
  }

  const list = templates as ReportTemplate[];
  const grouped = list.reduce<Record<string, ReportTemplate[]>>((acc, t) => {
    (acc[t.type] = acc[t.type] || []).push(t);
    return acc;
  }, {});
  const groupOrder = REPORT_TYPES.filter(t => grouped[t]?.length);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Report Templates</h1>
          <p className="text-xs text-slate-400 mt-0.5">Design letterheads, receipts and vouchers used across the school.</p>
        </div>
        <Btn variant="primary" size="md" onClick={() => setShowCreate(true)}><Plus size={14} /> Create Template</Btn>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-20 flex flex-col items-center justify-center text-center px-6">
          <PencilRuler size={36} className="text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600">No report templates yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Create your first template to design custom letterheads, fee receipts, vouchers and more.</p>
          <div className="mt-4">
            <Btn variant="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create Template</Btn>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupOrder.map(type => (
            <div key={type}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{REPORT_TYPE_LABELS[type as ReportType]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {grouped[type].map(template => (
                  <div key={template._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <TemplateThumbnail template={template} />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{template.name}</p>
                        <p className="text-xs text-slate-400">{REPORT_TYPE_LABELS[template.type]}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {template.isDefault && <Badge v="navy"><Star size={10} /> Default</Badge>}
                        {template.isActive ? (
                          <Badge v="green"><CheckCircle size={10} /> Active</Badge>
                        ) : (
                          <Badge v="gray"><XCircle size={10} /> Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-50">
                      <Btn size="sm" variant="primary" onClick={() => navigate(`/report-templates/designer/${template._id}`)}>
                        <PencilRuler size={12} /> Design
                      </Btn>
                      <Btn size="sm" variant="secondary" disabled={previewingId === template._id} onClick={() => handlePreview(template._id)}>
                        <Eye size={12} /> {previewingId === template._id ? "…" : "Preview"}
                      </Btn>
                      {!template.isDefault && (
                        <Btn size="sm" variant="secondary" onClick={() => setDefaultMutation.mutate(template._id)}>
                          <Star size={12} /> Set Default
                        </Btn>
                      )}
                      <Btn size="sm" variant="secondary" onClick={() => duplicateMutation.mutate(template._id)}>
                        <Copy size={12} /> Duplicate
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(template)}>
                        <Trash2 size={12} />
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            navigate(`/report-templates/designer/${created._id}`);
          }}
        />
      )}

      {confirmDelete && (
        <Modal title="Delete Template" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <span className="font-semibold">{confirmDelete.name}</span>? This cannot be undone.
          </p>
          <ModalFooter
            onCancel={() => setConfirmDelete(null)}
            onSave={() => deleteMutation.mutate(confirmDelete._id)}
            saving={deleteMutation.isPending}
            saveLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
          />
        </Modal>
      )}
    </div>
  );
}
