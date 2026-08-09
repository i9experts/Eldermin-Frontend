import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ZoomIn, ZoomOut, Undo2, Redo2, Eye, Save, ArrowLeft,
  Type, Table as TableIcon, Rows3, PenLine, Minus, Square, QrCode,
  Image as ImageIcon, Building2, Hash, CalendarDays,
  GripVertical, EyeOff, X, Plus, Trash2,
} from "lucide-react";
import {
  DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HexColorPicker } from "react-colorful";
import * as reportTemplatesApi from "../../services/report-templates.api";
import type { ReportTemplate, ReportTemplateSection } from "../../services/report-templates.api";

// ─── LOCAL PRIMITIVES ──────────────────────────────────────────────────────────
function Btn({ children, variant = "secondary", size = "sm", onClick, disabled, title }: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "xs"; onClick?: () => void; disabled?: boolean; title?: string;
}) {
  const v = {
    primary:   "bg-[#0C447C] text-white hover:bg-[#0b3d6e] border-[#0C447C]",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger:    "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
    ghost:     "bg-transparent text-slate-500 hover:bg-slate-100 border-transparent",
  };
  const s = size === "md" ? "px-4 py-2 text-sm" : size === "xs" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs";
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

const fInputCls = "w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0C447C] focus:border-transparent";
function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fInputCls} />;
}
function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={fInputCls + " bg-white cursor-pointer"}>{children}</select>;
}
function FTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={fInputCls + " resize-none"} rows={(props as { rows?: number }).rows ?? 3} />;
}
function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5">
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
function FCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-slate-600 mb-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-[#0C447C]" />
      {label}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2.5 relative">
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
      >
        <span className="w-4 h-4 rounded border border-slate-200" style={{ background: value }} />
        <span className="font-mono">{value}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 p-2">
          <HexColorPicker color={value} onChange={onChange} />
          <button className="mt-2 w-full text-xs text-center text-slate-500 hover:text-slate-800" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="border-b border-slate-100 py-2 group">
      <summary className="text-xs font-bold text-slate-700 uppercase tracking-wide cursor-pointer list-none flex items-center justify-between">
        {title}
        <span className="text-slate-400 group-open:rotate-90 transition-transform">›</span>
      </summary>
      <div className="mt-2.5">{children}</div>
    </details>
  );
}

// ─── DEFAULTS / SAMPLE DATA ─────────────────────────────────────────────────────
const SAMPLE_SCHOOL = {
  name: "Eldermin Model School",
  address: "123 Main Blvd, Lahore",
  phone: "+92 300 1234567",
  email: "info@school.edu",
  website: "www.eldermin-model.edu",
};

const PAGE_SIZES_MM: Record<string, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  Letter: { w: 216, h: 279 },
  custom: { w: 210, h: 297 },
};
const PX_PER_MM = 3.78;

function defaultConfigFor(type: ReportTemplateSection["type"]): any {
  switch (type) {
    case "table":
      return { columns: [{ label: "Description", field: "description" }, { label: "Amount", field: "amount" }], dataKey: "items", showBorders: true };
    case "key_value":
      return { fields: [{ label: "Field 1", field: "field1" }] };
    case "text":
      return { content: "Sample text", fontSize: 12, bold: false, italic: false, color: "#1e293b", alignment: "left" };
    case "signature_block":
      return { labels: ["Signature"], position: "spread" };
    case "spacer":
      return { height: 20 };
    case "qr_code":
      return { size: 60 };
    case "divider":
    default:
      return {};
  }
}

const PALETTE_ITEMS: { id: string; type: ReportTemplateSection["type"]; label: string; icon: any }[] = [
  { id: "palette-text", type: "text", label: "Text Block", icon: Type },
  { id: "palette-table", type: "table", label: "Table", icon: TableIcon },
  { id: "palette-key_value", type: "key_value", label: "Key-Value Grid", icon: Rows3 },
  { id: "palette-signature_block", type: "signature_block", label: "Signature Block", icon: PenLine },
  { id: "palette-divider", type: "divider", label: "Divider", icon: Minus },
  { id: "palette-spacer", type: "spacer", label: "Spacer", icon: Square },
  { id: "palette-qr_code", type: "qr_code", label: "QR Code", icon: QrCode },
];

const TOGGLE_ITEMS: { id: string; label: string; icon: any }[] = [
  { id: "toggle-logo", label: "Logo", icon: ImageIcon },
  { id: "toggle-school-info", label: "School Info", icon: Building2 },
  { id: "toggle-doc-number", label: "Document Number", icon: Hash },
  { id: "toggle-date", label: "Date Field", icon: CalendarDays },
];

// ─── HISTORY HOOK ───────────────────────────────────────────────────────────────
type History = { past: ReportTemplate[]; future: ReportTemplate[] };

// ─── DEFAULTS FOR PARTIAL/LEGACY TEMPLATE DOCUMENTS ─────────────────────────────
const DEFAULT_TEMPLATE_FIELDS: Pick<ReportTemplate, "page" | "letterhead" | "header" | "sections" | "footer"> = {
  page: { size: "A4", orientation: "portrait", marginTop: 20, marginBottom: 20, marginLeft: 20, marginRight: 20, watermark: { show: false, text: "", opacity: 0.1 } },
  letterhead: {
    showLogo: true, logoPosition: "left", logoSize: "medium",
    primaryColor: "#1B4F8A", accentColor: "#F5A623", borderStyle: "single", backgroundColor: "#ffffff",
    schoolName: { show: true, fontSize: 18, bold: true, color: "#1B4F8A" },
    schoolAddress: { show: true, fontSize: 11 },
    schoolPhone: { show: true },
    schoolEmail: { show: true },
    schoolWebsite: { show: false },
    tagline: { show: false, text: "" },
  },
  header: {
    title: { show: true, text: "", fontSize: 14, alignment: "center" },
    subtitle: { show: false, text: "" },
    showDocumentNumber: true, showDate: true, showAcademicYear: true, customFields: [],
  },
  sections: [],
  footer: {
    showPageNumber: true, showPrintDate: true, leftText: "", centerText: "", rightText: "",
    showSignatureLines: true, signatureLabels: ["Accountant", "Principal"], showStampArea: true, borderTop: true,
  },
};

function withDefaults(t: ReportTemplate): ReportTemplate {
  return {
    ...t,
    page: { ...DEFAULT_TEMPLATE_FIELDS.page, ...t.page, watermark: { ...DEFAULT_TEMPLATE_FIELDS.page.watermark, ...t.page?.watermark } },
    letterhead: {
      ...DEFAULT_TEMPLATE_FIELDS.letterhead, ...t.letterhead,
      schoolName: { ...DEFAULT_TEMPLATE_FIELDS.letterhead.schoolName, ...t.letterhead?.schoolName },
      schoolAddress: { ...DEFAULT_TEMPLATE_FIELDS.letterhead.schoolAddress, ...t.letterhead?.schoolAddress },
      schoolPhone: { ...DEFAULT_TEMPLATE_FIELDS.letterhead.schoolPhone, ...t.letterhead?.schoolPhone },
      schoolEmail: { ...DEFAULT_TEMPLATE_FIELDS.letterhead.schoolEmail, ...t.letterhead?.schoolEmail },
      schoolWebsite: { ...DEFAULT_TEMPLATE_FIELDS.letterhead.schoolWebsite, ...t.letterhead?.schoolWebsite },
      tagline: { ...DEFAULT_TEMPLATE_FIELDS.letterhead.tagline, ...t.letterhead?.tagline },
    },
    header: {
      ...DEFAULT_TEMPLATE_FIELDS.header, ...t.header,
      title: { ...DEFAULT_TEMPLATE_FIELDS.header.title, ...t.header?.title },
      subtitle: { ...DEFAULT_TEMPLATE_FIELDS.header.subtitle, ...t.header?.subtitle },
    },
    sections: t.sections || DEFAULT_TEMPLATE_FIELDS.sections,
    footer: { ...DEFAULT_TEMPLATE_FIELDS.footer, ...t.footer },
  };
}

// ─── PALETTE ITEM (draggable) ───────────────────────────────────────────────────
// `draggable` defaults to true for the "Drag to Canvas" content blocks
// (Text, Table, Key-Value Grid, etc.), which only respond to a drag-and-drop
// onto the canvas — clicking them does nothing. The four "Letterhead /
// Header" quick-enable buttons (Logo, School Info, Document Number, Date
// Field) are click-only by design (see handleToggleClick) and pass
// draggable={false}. Before this, useDraggable's listeners/attributes were
// spread onto every item unconditionally, so dragging one of those four
// toggle buttons onto the canvas was also possible — handleDragEnd would
// then call addSection() with a bogus type like "toggle-logo" (never
// stripped of its "toggle-" prefix the way real palette items are), which
// silently created an invisible, non-functional section with no matching
// case in SectionSampleBody/buildSectionHtml. That produced confusing,
// seemingly-broken clutter with no error or explanation - not what the two
// visually-identical panels were supposed to do.
function PaletteDraggable({ id, label, icon: Icon, onClickToggle, draggable = true }: { id: string; label: string; icon: any; onClickToggle?: () => void; draggable?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { fromPalette: true, id } });
  return (
    <button
      ref={setNodeRef}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      onClick={onClickToggle}
      type="button"
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-[#0C447C] hover:text-[#0C447C] transition-colors ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "opacity-40" : ""}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// ─── CANVAS DROP ZONE (droppable) ─────────────────────────────────────────────────
// Must be a child of <DndContext>, not called in the component that renders it —
// useDroppable() registers via React context, which only reaches descendants.
function CanvasDropZone({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "canvas" });
  return (
    <div ref={setNodeRef} className={className} style={style}>
      {children}
    </div>
  );
}

// ─── CANVAS SECTION (sortable) ───────────────────────────────────────────────────
function SectionSampleBody({ section }: { section: ReportTemplateSection }) {
  const cfg = section.config || {};
  switch (section.type) {
    case "text":
      return (
        <p style={{ fontSize: cfg.fontSize || 12, fontWeight: cfg.bold ? 700 : 400, fontStyle: cfg.italic ? "italic" : "normal", color: cfg.color || "#1e293b", textAlign: cfg.alignment || "left" }}>
          {cfg.content || "Sample text"}
        </p>
      );
    case "table": {
      const columns = cfg.columns?.length ? cfg.columns : [{ label: "Description", field: "description" }, { label: "Amount", field: "amount" }];
      const sampleRows = [
        { description: "Tuition Fee — July", amount: "12,000" },
        { description: "Transport Fee", amount: "3,500" },
        { description: "Lab Fee", amount: "1,200" },
      ];
      return (
        <table className={`w-full text-[11px] ${cfg.showBorders !== false ? "border border-slate-300" : ""}`}>
          <thead>
            <tr>
              {columns.map((c: any, i: number) => (
                <th key={i} className={`text-left px-2 py-1 font-semibold bg-slate-100 ${cfg.showBorders !== false ? "border border-slate-300" : ""}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((c: any, ci: number) => (
                  <td key={ci} className={`px-2 py-1 ${cfg.showBorders !== false ? "border border-slate-300" : ""}`}>
                    {(row as any)[c.field] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case "key_value": {
      const fields = cfg.fields?.length ? cfg.fields : [{ label: "Field 1", field: "field1" }];
      const sample: Record<string, string> = {
        field1: "Ahmed Khan", name: "Ahmed Khan", class: "Grade 5-A", rollNo: "23",
        fatherName: "Muhammad Khan", father_name: "Muhammad Khan",
      };
      return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          {fields.map((f: any, i: number) => (
            <div key={i} className="flex justify-between border-b border-dotted border-slate-300 py-0.5">
              <span className="text-slate-500">{f.label}</span>
              <span className="font-semibold">{sample[f.field] || "Sample Value"}</span>
            </div>
          ))}
        </div>
      );
    }
    case "signature_block": {
      const labels = cfg.labels?.length ? cfg.labels : ["Signature"];
      const justify = cfg.position === "left" ? "justify-start" : cfg.position === "right" ? "justify-end" : cfg.position === "center" ? "justify-center" : "justify-between";
      return (
        <div className={`flex ${justify} gap-8 pt-6 text-[11px]`}>
          {labels.map((l: string, i: number) => (
            <div key={i} className="text-center">
              <div className="w-28 border-t border-slate-500 mb-1" />
              <span className="text-slate-500">{l}</span>
            </div>
          ))}
        </div>
      );
    }
    case "divider":
      return <hr className="border-slate-300" />;
    case "spacer":
      return <div style={{ height: cfg.height || 20 }} />;
    case "qr_code":
      return (
        <div className="flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-[10px]" style={{ width: cfg.size || 60, height: cfg.size || 60 }}>
          QR CODE
        </div>
      );
    default:
      return null;
  }
}

function CanvasSection({ section, selected, onSelect, onToggleVisible, onDelete }: {
  section: ReportTemplateSection;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : section.visible ? 1 : 0.4 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative group border rounded-md px-3 py-2 mb-2 cursor-pointer ${selected ? "border-[#0C447C] ring-1 ring-[#0C447C]" : "border-transparent hover:border-slate-300"}`}
    >
      <div className={`absolute -top-3 right-1 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-md shadow-sm px-1 py-0.5 z-10`}>
        <button {...attributes} {...listeners} className="p-1 text-slate-400 hover:text-slate-700 cursor-grab" title="Drag to reorder" onClick={e => e.stopPropagation()}>
          <GripVertical size={12} />
        </button>
        <button className="p-1 text-slate-400 hover:text-slate-700" title={section.visible ? "Hide" : "Show"} onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}>
          {section.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button className="p-1 text-slate-400 hover:text-red-600" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <X size={12} />
        </button>
      </div>
      <SectionSampleBody section={section} />
    </div>
  );
}

// ─── MAIN DESIGNER ───────────────────────────────────────────────────────────────
export default function ReportTemplatesDesigner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, isFetching } = useQuery({
    queryKey: ["report-templates"],
    queryFn: reportTemplatesApi.fetchTemplates,
  });

  const original = useMemo(() => {
    const found = (templates as ReportTemplate[]).find(t => t._id === id);
    return found ? withDefaults(found) : undefined;
  }, [templates, id]);

  const [state, setState] = useState<ReportTemplate | null>(null);
  const [history, setHistory] = useState<History>({ past: [], future: [] });
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [dirty, setDirty] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<{ label: string; icon: any } | null>(null);

  if (state === null && original) {
    setState(original);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function pushHistory(prev: ReportTemplate) {
    setHistory(h => ({ past: [...h.past, prev], future: [] }));
  }

  function update(mutator: (draft: ReportTemplate) => ReportTemplate, opts?: { skipHistory?: boolean }) {
    setState(prev => {
      if (!prev) return prev;
      if (!opts?.skipHistory) pushHistory(prev);
      setDirty(true);
      return mutator(prev);
    });
  }

  function undo() {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      setState(current => {
        if (current) h.future = [current, ...h.future];
        return previous;
      });
      setDirty(true);
      return { past: h.past.slice(0, -1), future: h.future };
    });
  }
  function redo() {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      setState(current => {
        if (current) h.past = [...h.past, current];
        return next;
      });
      setDirty(true);
      return { past: h.past, future: h.future.slice(1) };
    });
  }

  const saveMutation = useMutation({
    mutationFn: () => reportTemplatesApi.updateTemplate(id!, state!),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
      toast.success("Template saved");
      setDirty(false);
      setState(saved);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to save template"),
  });

  async function handlePreview() {
    if (!id) return;
    setPreviewing(true);
    try {
      if (dirty) {
        await reportTemplatesApi.updateTemplate(id, state!);
        queryClient.invalidateQueries({ queryKey: ["report-templates"] });
        setDirty(false);
      }
      const url = await reportTemplatesApi.previewTemplate(id);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate preview");
    } finally {
      setPreviewing(false);
    }
  }

  function addSection(type: ReportTemplateSection["type"]) {
    update(draft => {
      const newSection: ReportTemplateSection = {
        id: crypto.randomUUID(),
        type,
        order: draft.sections.length,
        visible: true,
        config: defaultConfigFor(type),
      };
      return { ...draft, sections: [...draft.sections, newSection] };
    });
  }

  function handleToggleClick(toggleId: string) {
    update(draft => {
      switch (toggleId) {
        case "toggle-logo":
          return { ...draft, letterhead: { ...draft.letterhead, showLogo: true } };
        case "toggle-school-info":
          return {
            ...draft,
            letterhead: {
              ...draft.letterhead,
              schoolName: { ...draft.letterhead.schoolName, show: true },
              schoolAddress: { ...draft.letterhead.schoolAddress, show: true },
              schoolPhone: { ...draft.letterhead.schoolPhone, show: true },
              schoolEmail: { ...draft.letterhead.schoolEmail, show: true },
            },
          };
        case "toggle-doc-number":
          return { ...draft, header: { ...draft.header, showDocumentNumber: true } };
        case "toggle-date":
          return { ...draft, header: { ...draft.header, showDate: true } };
        default:
          return draft;
      }
    });
    setSelectedSectionId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !state) return;

    if (active.data.current?.fromPalette) {
      const rawId = String(active.data.current.id);
      // Belt-and-suspenders: the "Letterhead / Header" quick-enable buttons
      // are no longer draggable at all (see PaletteDraggable's `draggable`
      // prop), but if a bogus id from anywhere else ever reaches here, only
      // ever create a section for an id that's actually a real palette
      // item — never a made-up type like "toggle-logo" with no matching
      // renderer.
      if (!rawId.startsWith("palette-")) return;
      const type = rawId.replace("palette-", "") as ReportTemplateSection["type"];
      if (!PALETTE_ITEMS.some(p => p.type === type)) return;
      if (over.id === "canvas" || state.sections.some(s => s.id === over.id)) {
        addSection(type);
      }
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = state.sections.findIndex(s => s.id === active.id);
      const newIndex = state.sections.findIndex(s => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      update(draft => {
        const reordered = arrayMove(draft.sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
        return { ...draft, sections: reordered };
      });
    }
  }

  const template = state ?? original ?? null;

  if (!template) {
    if (isLoading || isFetching) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-[#0C447C] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-sm font-semibold text-slate-600">Template not found</p>
        <Btn variant="primary" onClick={() => navigate("/report-templates")} title="Back to templates">
          <ArrowLeft size={14} /> Back to Templates
        </Btn>
      </div>
    );
  }
  const pageSize = PAGE_SIZES_MM[template.page.size] || PAGE_SIZES_MM.A4;
  const isLandscape = template.page.orientation === "landscape";
  const pageW = (isLandscape ? pageSize.h : pageSize.w) * PX_PER_MM;
  const pageH = (isLandscape ? pageSize.w : pageSize.h) * PX_PER_MM;

  const selectedSection = template.sections.find(s => s.id === selectedSectionId) || null;
  const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate("/report-templates")} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500" title="Back">
            <ArrowLeft size={16} />
          </button>
          <input
            value={template.name}
            onChange={e => update(d => ({ ...d, name: e.target.value }))}
            className="text-sm font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-[#0C447C] outline-none px-1 py-0.5 min-w-[160px]"
          />
          <FSelect
            value={template.page.size}
            onChange={e => update(d => ({ ...d, page: { ...d.page, size: e.target.value as ReportTemplate["page"]["size"] } }))}
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
          </FSelect>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Btn variant="ghost" size="xs" onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(2)))} title="Zoom out"><ZoomOut size={14} /></Btn>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Btn variant="ghost" size="xs" onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(2)))} title="Zoom in"><ZoomIn size={14} /></Btn>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Btn variant="ghost" size="xs" onClick={undo} disabled={history.past.length === 0} title="Undo"><Undo2 size={14} /></Btn>
          <Btn variant="ghost" size="xs" onClick={redo} disabled={history.future.length === 0} title="Redo"><Redo2 size={14} /></Btn>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <Btn variant="secondary" onClick={handlePreview} disabled={previewing}><Eye size={13} /> {previewing ? "Preparing…" : "Preview PDF"}</Btn>
          <Btn variant="primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !dirty}>
            <Save size={13} /> {saveMutation.isPending ? "Saving…" : dirty ? "Save Template" : "Saved"}
          </Btn>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const paletteItem = PALETTE_ITEMS.find(p => p.id === e.active.id);
          setActiveDragItem(paletteItem ? { label: paletteItem.label, icon: paletteItem.icon } : null);
        }}
        onDragEnd={(e) => { handleDragEnd(e); setActiveDragItem(null); }}
        onDragCancel={() => setActiveDragItem(null)}
      >
        <div className="flex flex-1 min-h-0">
          {/* ── LEFT PANEL: COMPONENT LIBRARY ── */}
          <div className="w-[220px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Letterhead / Header</p>
            <div className="space-y-1.5 mb-4">
              {TOGGLE_ITEMS.map(item => (
                <PaletteDraggable key={item.id} id={item.id} label={item.label} icon={item.icon} onClickToggle={() => handleToggleClick(item.id)} draggable={false} />
              ))}
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Drag to Canvas</p>
            <div className="space-y-1.5">
              {PALETTE_ITEMS.map(item => (
                <PaletteDraggable key={item.id} id={item.id} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>

          {/* ── CENTER: CANVAS ── */}
          <div className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", height: "fit-content" }}>
              <CanvasDropZone
                className="shadow-lg"
                style={{
                  width: pageW,
                  minHeight: pageH,
                  background: template.letterhead.backgroundColor || "#ffffff",
                  paddingTop: template.page.marginTop * PX_PER_MM,
                  paddingBottom: template.page.marginBottom * PX_PER_MM,
                  paddingLeft: template.page.marginLeft * PX_PER_MM,
                  paddingRight: template.page.marginRight * PX_PER_MM,
                  border: template.letterhead.borderStyle === "single" ? `1px solid ${template.letterhead.primaryColor}` :
                    template.letterhead.borderStyle === "double" ? `4px double ${template.letterhead.primaryColor}` : "none",
                  boxShadow: template.letterhead.borderStyle === "shadow" ? "0 4px 20px rgba(0,0,0,0.15)" : undefined,
                  position: "relative",
                }}
              >
                {template.page.watermark?.show && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                    style={{ opacity: (template.page.watermark.opacity ?? 10) / 100, fontSize: 48, fontWeight: 700, color: template.letterhead.primaryColor, transform: "rotate(-30deg)" }}
                  >
                    {template.page.watermark.text || "DRAFT"}
                  </div>
                )}

                {/* Letterhead */}
                <div
                  className="flex items-center gap-3 pb-3 mb-3 border-b"
                  style={{ borderColor: template.letterhead.primaryColor + "40", justifyContent: template.letterhead.logoPosition === "center" ? "center" : template.letterhead.logoPosition === "right" ? "flex-end" : "flex-start" }}
                >
                  {template.letterhead.showLogo && (
                    <div
                      className="bg-slate-200 flex items-center justify-center text-[9px] text-slate-500 font-semibold shrink-0"
                      style={{
                        width: template.letterhead.logoSize === "small" ? 32 : template.letterhead.logoSize === "large" ? 64 : 48,
                        height: template.letterhead.logoSize === "small" ? 32 : template.letterhead.logoSize === "large" ? 64 : 48,
                      }}
                    >
                      LOGO
                    </div>
                  )}
                  <div style={{ textAlign: template.letterhead.logoPosition === "center" ? "center" : "left" }}>
                    {template.letterhead.schoolName.show && (
                      <p style={{ fontSize: template.letterhead.schoolName.fontSize, fontWeight: template.letterhead.schoolName.bold ? 700 : 500, color: template.letterhead.schoolName.color }}>
                        {SAMPLE_SCHOOL.name}
                      </p>
                    )}
                    {template.letterhead.schoolAddress.show && (
                      <p style={{ fontSize: template.letterhead.schoolAddress.fontSize }} className="text-slate-500">{SAMPLE_SCHOOL.address}</p>
                    )}
                    <p className="text-slate-500 text-[10px] flex gap-2 flex-wrap">
                      {template.letterhead.schoolPhone.show && <span>{SAMPLE_SCHOOL.phone}</span>}
                      {template.letterhead.schoolEmail.show && <span>{SAMPLE_SCHOOL.email}</span>}
                      {template.letterhead.schoolWebsite.show && <span>{SAMPLE_SCHOOL.website}</span>}
                    </p>
                    {template.letterhead.tagline.show && (
                      <p className="text-[10px] italic" style={{ color: template.letterhead.accentColor }}>{template.letterhead.tagline.text}</p>
                    )}
                  </div>
                </div>

                {/* Header */}
                <div className="mb-3">
                  {template.header.title.show && (
                    <p style={{ fontSize: template.header.title.fontSize, textAlign: template.header.title.alignment, fontWeight: 700, color: template.letterhead.primaryColor }}>
                      {template.header.title.text || "Document Title"}
                    </p>
                  )}
                  {template.header.subtitle.show && (
                    <p className="text-xs text-slate-500 text-center">{template.header.subtitle.text}</p>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{template.header.showDocumentNumber && "Doc #: FR-2026-0001"}</span>
                    <span className="flex gap-3">
                      {template.header.showDate && <span>Date: {new Date().toLocaleDateString()}</span>}
                      {template.header.showAcademicYear && <span>AY: 2025-26</span>}
                    </span>
                  </div>
                </div>

                {/* Sections */}
                <div onClick={() => setSelectedSectionId(null)}>
                  <SortableContext items={sortedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sortedSections.length === 0 ? (
                      <div className="text-center text-xs text-slate-300 border-2 border-dashed border-slate-200 rounded-lg py-10">
                        Drag components from the left panel onto this canvas
                      </div>
                    ) : sortedSections.map(section => (
                      <CanvasSection
                        key={section.id}
                        section={section}
                        selected={section.id === selectedSectionId}
                        onSelect={() => setSelectedSectionId(section.id)}
                        onToggleVisible={() => update(d => ({ ...d, sections: d.sections.map(s => s.id === section.id ? { ...s, visible: !s.visible } : s) }))}
                        onDelete={() => update(d => ({ ...d, sections: d.sections.filter(s => s.id !== section.id) }))}
                      />
                    ))}
                  </SortableContext>
                </div>

                {/* Footer */}
                <div className={`mt-6 pt-2 text-[10px] text-slate-500 ${template.footer.borderTop ? "border-t" : ""}`} style={{ borderColor: template.letterhead.primaryColor + "40" }}>
                  <div className="flex justify-between">
                    <span>{template.footer.leftText}</span>
                    <span>{template.footer.centerText}</span>
                    <span>{template.footer.rightText}</span>
                  </div>
                  {template.footer.showSignatureLines && (
                    <div className="flex justify-between gap-8 mt-6">
                      {(template.footer.signatureLabels || []).map((label, i) => (
                        <div key={i} className="text-center flex-1">
                          <div className="border-t border-slate-500 mb-1" />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between mt-2">
                    {template.footer.showStampArea && (
                      <div className="w-16 h-16 border border-dashed border-slate-300 flex items-center justify-center text-slate-300">Stamp</div>
                    )}
                    <div className="flex-1" />
                    <div className="flex flex-col items-end gap-0.5">
                      {template.footer.showPrintDate && <span>Printed: {new Date().toLocaleDateString()}</span>}
                      {template.footer.showPageNumber && <span>Page 1 of 1</span>}
                    </div>
                  </div>
                </div>
              </CanvasDropZone>
            </div>
          </div>

          {/* ── RIGHT PANEL: PROPERTIES ── */}
          <div className="w-[300px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-3">
            {selectedSection ? (
              <SectionProperties
                section={selectedSection}
                onChange={(config) => update(d => ({ ...d, sections: d.sections.map(s => s.id === selectedSection.id ? { ...s, config } : s) }))}
                onClose={() => setSelectedSectionId(null)}
              />
            ) : (
              <GlobalProperties template={template} onUpdate={(mutator) => update(mutator)} />
            )}
          </div>
        </div>
        <DragOverlay>
          {activeDragItem && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#0C447C] bg-white text-xs font-medium text-[#0C447C] shadow-lg cursor-grabbing">
              <activeDragItem.icon size={14} />
              {activeDragItem.label}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── GLOBAL PROPERTIES PANEL ────────────────────────────────────────────────────
function GlobalProperties({ template, onUpdate }: { template: ReportTemplate; onUpdate: (mutator: (d: ReportTemplate) => ReportTemplate) => void }) {
  return (
    <div>
      <Accordion title="Page Settings" defaultOpen>
        <FField label="Page Size">
          <FSelect value={template.page.size} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, size: e.target.value as ReportTemplate["page"]["size"] } }))}>
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
            <option value="custom">Custom</option>
          </FSelect>
        </FField>
        <FField label="Orientation">
          <FSelect value={template.page.orientation} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, orientation: e.target.value as "portrait" | "landscape" } }))}>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </FSelect>
        </FField>
        <div className="grid grid-cols-2 gap-2">
          <FField label="Margin Top (mm)">
            <FInput type="number" value={template.page.marginTop} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, marginTop: Number(e.target.value) } }))} />
          </FField>
          <FField label="Margin Bottom (mm)">
            <FInput type="number" value={template.page.marginBottom} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, marginBottom: Number(e.target.value) } }))} />
          </FField>
          <FField label="Margin Left (mm)">
            <FInput type="number" value={template.page.marginLeft} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, marginLeft: Number(e.target.value) } }))} />
          </FField>
          <FField label="Margin Right (mm)">
            <FInput type="number" value={template.page.marginRight} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, marginRight: Number(e.target.value) } }))} />
          </FField>
        </div>
        <FCheck label="Show Watermark" checked={template.page.watermark?.show} onChange={v => onUpdate(d => ({ ...d, page: { ...d.page, watermark: { ...d.page.watermark, show: v } } }))} />
        {template.page.watermark?.show && (
          <>
            <FField label="Watermark Text">
              <FInput value={template.page.watermark.text} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, watermark: { ...d.page.watermark, text: e.target.value } } }))} />
            </FField>
            <FField label="Opacity (%)">
              <FInput type="number" min={0} max={100} value={template.page.watermark.opacity} onChange={e => onUpdate(d => ({ ...d, page: { ...d.page, watermark: { ...d.page.watermark, opacity: Number(e.target.value) } } }))} />
            </FField>
          </>
        )}
      </Accordion>

      <Accordion title="Letterhead Settings">
        <FCheck label="Show Logo" checked={template.letterhead.showLogo} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, showLogo: v } }))} />
        <FField label="Logo Position">
          <FSelect value={template.letterhead.logoPosition} onChange={e => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, logoPosition: e.target.value as any } }))}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </FSelect>
        </FField>
        <FField label="Logo Size">
          <FSelect value={template.letterhead.logoSize} onChange={e => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, logoSize: e.target.value as any } }))}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </FSelect>
        </FField>
        <FCheck label="Show School Name" checked={template.letterhead.schoolName.show} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolName: { ...d.letterhead.schoolName, show: v } } }))} />
        <div className="grid grid-cols-2 gap-2">
          <FField label="Name Font Size">
            <FInput type="number" value={template.letterhead.schoolName.fontSize} onChange={e => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolName: { ...d.letterhead.schoolName, fontSize: Number(e.target.value) } } }))} />
          </FField>
          <FField label="Bold">
            <FSelect value={template.letterhead.schoolName.bold ? "yes" : "no"} onChange={e => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolName: { ...d.letterhead.schoolName, bold: e.target.value === "yes" } } }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </FSelect>
          </FField>
        </div>
        <ColorField label="School Name Color" value={template.letterhead.schoolName.color} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolName: { ...d.letterhead.schoolName, color: v } } }))} />
        <FCheck label="Show Address" checked={template.letterhead.schoolAddress.show} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolAddress: { ...d.letterhead.schoolAddress, show: v } } }))} />
        <FCheck label="Show Phone" checked={template.letterhead.schoolPhone.show} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolPhone: { show: v } } }))} />
        <FCheck label="Show Email" checked={template.letterhead.schoolEmail.show} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolEmail: { show: v } } }))} />
        <FCheck label="Show Website" checked={template.letterhead.schoolWebsite.show} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, schoolWebsite: { show: v } } }))} />
        <FCheck label="Show Tagline" checked={template.letterhead.tagline.show} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, tagline: { ...d.letterhead.tagline, show: v } } }))} />
        {template.letterhead.tagline.show && (
          <FField label="Tagline Text">
            <FInput value={template.letterhead.tagline.text} onChange={e => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, tagline: { ...d.letterhead.tagline, text: e.target.value } } }))} />
          </FField>
        )}
        <FField label="Border Style">
          <FSelect value={template.letterhead.borderStyle} onChange={e => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, borderStyle: e.target.value as any } }))}>
            <option value="none">None</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="shadow">Shadow</option>
          </FSelect>
        </FField>
        <ColorField label="Background Color" value={template.letterhead.backgroundColor} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, backgroundColor: v } }))} />
        <ColorField label="Primary Color" value={template.letterhead.primaryColor} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, primaryColor: v } }))} />
        <ColorField label="Accent Color" value={template.letterhead.accentColor} onChange={v => onUpdate(d => ({ ...d, letterhead: { ...d.letterhead, accentColor: v } }))} />
      </Accordion>

      <Accordion title="Header Settings">
        <FCheck label="Show Title" checked={template.header.title.show} onChange={v => onUpdate(d => ({ ...d, header: { ...d.header, title: { ...d.header.title, show: v } } }))} />
        <FField label="Title Text">
          <FInput value={template.header.title.text} onChange={e => onUpdate(d => ({ ...d, header: { ...d.header, title: { ...d.header.title, text: e.target.value } } }))} />
        </FField>
        <div className="grid grid-cols-2 gap-2">
          <FField label="Title Font Size">
            <FInput type="number" value={template.header.title.fontSize} onChange={e => onUpdate(d => ({ ...d, header: { ...d.header, title: { ...d.header.title, fontSize: Number(e.target.value) } } }))} />
          </FField>
          <FField label="Alignment">
            <FSelect value={template.header.title.alignment} onChange={e => onUpdate(d => ({ ...d, header: { ...d.header, title: { ...d.header.title, alignment: e.target.value as any } } }))}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </FSelect>
          </FField>
        </div>
        <FCheck label="Show Subtitle" checked={template.header.subtitle.show} onChange={v => onUpdate(d => ({ ...d, header: { ...d.header, subtitle: { ...d.header.subtitle, show: v } } }))} />
        {template.header.subtitle.show && (
          <FField label="Subtitle Text">
            <FInput value={template.header.subtitle.text} onChange={e => onUpdate(d => ({ ...d, header: { ...d.header, subtitle: { ...d.header.subtitle, text: e.target.value } } }))} />
          </FField>
        )}
        <FCheck label="Show Document Number" checked={template.header.showDocumentNumber} onChange={v => onUpdate(d => ({ ...d, header: { ...d.header, showDocumentNumber: v } }))} />
        <FCheck label="Show Date" checked={template.header.showDate} onChange={v => onUpdate(d => ({ ...d, header: { ...d.header, showDate: v } }))} />
        <FCheck label="Show Academic Year" checked={template.header.showAcademicYear} onChange={v => onUpdate(d => ({ ...d, header: { ...d.header, showAcademicYear: v } }))} />
      </Accordion>

      <Accordion title="Footer Settings">
        <FField label="Left Text">
          <FInput value={template.footer.leftText} onChange={e => onUpdate(d => ({ ...d, footer: { ...d.footer, leftText: e.target.value } }))} />
        </FField>
        <FField label="Center Text">
          <FInput value={template.footer.centerText} onChange={e => onUpdate(d => ({ ...d, footer: { ...d.footer, centerText: e.target.value } }))} />
        </FField>
        <FField label="Right Text">
          <FInput value={template.footer.rightText} onChange={e => onUpdate(d => ({ ...d, footer: { ...d.footer, rightText: e.target.value } }))} />
        </FField>
        <FCheck label="Show Page Number" checked={template.footer.showPageNumber} onChange={v => onUpdate(d => ({ ...d, footer: { ...d.footer, showPageNumber: v } }))} />
        <FCheck label="Show Print Date" checked={template.footer.showPrintDate} onChange={v => onUpdate(d => ({ ...d, footer: { ...d.footer, showPrintDate: v } }))} />
        <FCheck label="Show Signature Lines" checked={template.footer.showSignatureLines} onChange={v => onUpdate(d => ({ ...d, footer: { ...d.footer, showSignatureLines: v } }))} />
        {template.footer.showSignatureLines && (
          <ListEditor
            items={template.footer.signatureLabels || []}
            onChange={(labels) => onUpdate(d => ({ ...d, footer: { ...d.footer, signatureLabels: labels } }))}
            placeholder="Signature label"
          />
        )}
        <FCheck label="Show Stamp Area" checked={template.footer.showStampArea} onChange={v => onUpdate(d => ({ ...d, footer: { ...d.footer, showStampArea: v } }))} />
        <FCheck label="Border Top" checked={template.footer.borderTop} onChange={v => onUpdate(d => ({ ...d, footer: { ...d.footer, borderTop: v } }))} />
      </Accordion>
    </div>
  );
}

// ─── SIMPLE STRING LIST EDITOR (e.g. signature labels) ─────────────────────────
function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5 mb-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <FInput value={item} placeholder={placeholder} onChange={e => onChange(items.map((it, idx) => idx === i ? e.target.value : it))} />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-400 hover:text-red-600 shrink-0">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <Btn size="xs" variant="secondary" onClick={() => onChange([...items, ""])}><Plus size={11} /> Add</Btn>
    </div>
  );
}

// ─── KEY-VALUE PAIR LIST EDITOR (label/field) ──────────────────────────────────
function PairListEditor({ items, onChange }: { items: { label: string; field: string }[]; onChange: (items: { label: string; field: string }[]) => void }) {
  return (
    <div className="space-y-1.5 mb-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <FInput placeholder="Label" value={item.label} onChange={e => onChange(items.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it))} />
          <FInput placeholder="field_key" value={item.field} onChange={e => onChange(items.map((it, idx) => idx === i ? { ...it, field: e.target.value } : it))} />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-1.5 text-slate-400 hover:text-red-600 shrink-0">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <Btn size="xs" variant="secondary" onClick={() => onChange([...items, { label: "", field: "" }])}><Plus size={11} /> Add Row</Btn>
    </div>
  );
}

// ─── SECTION PROPERTIES PANEL ───────────────────────────────────────────────────
function SectionProperties({ section, onChange, onClose }: {
  section: ReportTemplateSection;
  onChange: (config: any) => void;
  onClose: () => void;
}) {
  const cfg = section.config || {};
  const typeLabels: Record<string, string> = {
    text: "Text Block", table: "Table", key_value: "Key-Value Grid",
    signature_block: "Signature Block", divider: "Divider", spacer: "Spacer", qr_code: "QR Code",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{typeLabels[section.type] || section.type} Properties</p>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded"><X size={14} /></button>
      </div>

      {section.type === "text" && (
        <>
          <FField label="Content">
            <FTextarea rows={4} value={cfg.content || ""} onChange={e => onChange({ ...cfg, content: e.target.value })} />
          </FField>
          <FField label="Font Size">
            <FInput type="number" value={cfg.fontSize ?? 12} onChange={e => onChange({ ...cfg, fontSize: Number(e.target.value) })} />
          </FField>
          <div className="flex gap-4 mb-2.5">
            <FCheck label="Bold" checked={!!cfg.bold} onChange={v => onChange({ ...cfg, bold: v })} />
            <FCheck label="Italic" checked={!!cfg.italic} onChange={v => onChange({ ...cfg, italic: v })} />
          </div>
          <ColorField label="Color" value={cfg.color || "#1e293b"} onChange={v => onChange({ ...cfg, color: v })} />
          <FField label="Alignment">
            <FSelect value={cfg.alignment || "left"} onChange={e => onChange({ ...cfg, alignment: e.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </FSelect>
          </FField>
        </>
      )}

      {section.type === "table" && (
        <>
          <FField label="Columns">
            <PairListEditor items={cfg.columns || []} onChange={(columns) => onChange({ ...cfg, columns })} />
          </FField>
          <FField label="Data Key">
            <FInput value={cfg.dataKey || ""} onChange={e => onChange({ ...cfg, dataKey: e.target.value })} placeholder="e.g. items" />
          </FField>
          <FCheck label="Show Borders" checked={cfg.showBorders !== false} onChange={v => onChange({ ...cfg, showBorders: v })} />
        </>
      )}

      {section.type === "key_value" && (
        <FField label="Fields">
          <PairListEditor items={cfg.fields || []} onChange={(fields) => onChange({ ...cfg, fields })} />
        </FField>
      )}

      {section.type === "signature_block" && (
        <>
          <FField label="Labels">
            <ListEditor items={cfg.labels || []} onChange={(labels) => onChange({ ...cfg, labels })} placeholder="e.g. Principal" />
          </FField>
          <FField label="Position">
            <FSelect value={cfg.position || "spread"} onChange={e => onChange({ ...cfg, position: e.target.value })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="spread">Spread</option>
            </FSelect>
          </FField>
        </>
      )}

      {section.type === "divider" && (
        <p className="text-xs text-slate-400">A simple horizontal divider line. No additional settings.</p>
      )}

      {section.type === "spacer" && (
        <FField label="Height (px)">
          <FInput type="number" value={cfg.height ?? 20} onChange={e => onChange({ ...cfg, height: Number(e.target.value) })} />
        </FField>
      )}

      {section.type === "qr_code" && (
        <>
          <p className="text-xs text-slate-400 mb-2.5">Renders a placeholder box with the document reference. Live QR code generation isn't available yet.</p>
          <FField label="Size (px)">
            <FInput type="number" value={cfg.size ?? 60} onChange={e => onChange({ ...cfg, size: Number(e.target.value) })} />
          </FField>
        </>
      )}
    </div>
  );
}
