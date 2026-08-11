import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as assessmentApi from "../../services/assessment.api";
import { useStudents } from "../../hooks/useStudents";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_capture: { label: "Pending Photo", color: "bg-slate-100 text-slate-500" },
  uploaded: { label: "Uploaded", color: "bg-blue-50 text-blue-700" },
  processed: { label: "Processed", color: "bg-teal-50 text-teal-700" },
  needs_review: { label: "Needs Review", color: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700" },
};

export default function OMRManager({ paper, onBack }: { paper: any; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);
  const [view, setView] = useState<"sheets" | "review">("sheets");

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ["omr-sheets", paper._id],
    queryFn: () => assessmentApi.getOMRSheets(paper._id),
  });

  const { data: studentsData } = useStudents({ grade: paper.grade, section: paper.section, limit: 200 });
  const studentList: any[] = studentsData?.data || studentsData || [];

  const generateSheets = useMutation({
    mutationFn: () => assessmentApi.generateOMRSheets(paper._id, studentList.map((s: any) => s._id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["omr-sheets", paper._id] });
      toast.success(`Generated ${studentList.length} personalized answer sheets`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to generate sheets"),
  });

  const sheetList: any[] = sheets as any[];
  const notGenerated = studentList.length > 0 && sheetList.length === 0;
  const totalConfirmed = sheetList.filter((s) => s.status === "confirmed").length;
  const needsReview = sheetList.filter((s) => s.status === "needs_review").length;

  if (view === "review" && selectedSheet) {
    return (
      <ReviewScreen
        sheet={selectedSheet}
        paper={paper}
        onBack={() => { setView("sheets"); setSelectedSheet(null); }}
        onConfirmed={() => {
          queryClient.invalidateQueries({ queryKey: ["omr-sheets", paper._id] });
          setView("sheets");
          setSelectedSheet(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">← Back to papers</button>
        <h2 className="text-base font-semibold text-slate-800">{paper.title} — OMR Sheets</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 text-xs text-amber-800">
        <strong>Before relying on detection results:</strong> this algorithm has not yet been tested against real photographed sheets — detection thresholds may need real-world calibration. Always review flagged answers before confirming a score.
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{sheetList.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Sheets</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{needsReview}</p>
          <p className="text-xs text-slate-400 mt-1">Needs Review</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalConfirmed}</p>
          <p className="text-xs text-slate-400 mt-1">Confirmed</p>
        </div>
      </div>

      {notGenerated && (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center mb-4">
          <p className="font-semibold text-slate-700 mb-1">No sheets generated yet</p>
          <p className="text-sm text-slate-400 mb-4">
            This will create {studentList.length} personalized answer sheet{studentList.length !== 1 ? "s" : ""} — one per student in {paper.grade}{paper.section ? ` - ${paper.section}` : ""}, each with their own QR code and bubble grid.
          </p>
          <button
            onClick={() => generateSheets.mutate()}
            disabled={generateSheets.isPending || studentList.length === 0}
            className="bg-[#1e3a5f] text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {generateSheets.isPending ? "Generating…" : `Generate ${studentList.length} Sheets`}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-center py-10 text-slate-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Student</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Sheet Code</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Score</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sheetList.map((s: any) => {
                const status = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending_capture;
                return (
                  <tr key={s._id} className="border-t border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.student ? `${s.student.firstName} ${s.student.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{s.sheetCode}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.status === "confirmed" ? `${s.score} / ${s.totalMarks}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SheetActions
                        sheet={s}
                        onReview={() => { setSelectedSheet(s); setView("review"); }}
                        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["omr-sheets", paper._id] })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SheetActions({ sheet, onReview, onRefresh }: { sheet: any; onReview: () => void; onRefresh: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await assessmentApi.downloadOMRSheetPdf(sheet._id, sheet.student ? `${sheet.student.firstName}-${sheet.student.lastName}` : sheet.sheetCode);
    } catch { toast.error("Download failed"); }
    finally { setDownloading(false); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await assessmentApi.uploadOMRSheetPhoto(sheet._id, file);
      toast.success("Photo uploaded and processed");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={handleDownload} disabled={downloading}
        className="text-[10px] border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-40">
        {downloading ? "…" : "PDF"}
      </button>
      {["pending_capture", "uploaded", "processed"].includes(sheet.status) && (
        <>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-[10px] border border-slate-200 rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-40">
            {uploading ? "Uploading…" : "📷 Upload"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </>
      )}
      {["processed", "needs_review"].includes(sheet.status) && (
        <button onClick={onReview}
          className={`text-[10px] px-2 py-1 rounded ${sheet.status === "needs_review" ? "bg-amber-100 text-amber-700" : "border border-slate-200 hover:bg-slate-50"}`}>
          {sheet.status === "needs_review" ? "⚠ Review" : "Review"}
        </button>
      )}
    </div>
  );
}

function ReviewScreen({ sheet, paper, onBack, onConfirmed }: { sheet: any; paper: any; onBack: () => void; onConfirmed: () => void }) {
  const mcqQuestions = paper.omrLayout?.questions || [];
  const detectedMap = new Map((sheet.detectedAnswers || []).map((d: any) => [d.questionNumber, d]));

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const d of sheet.detectedAnswers || []) {
      if (d.detectedOption && !d.isAmbiguous) init[d.questionNumber] = d.detectedOption;
    }
    return init;
  });

  const confirmMut = useMutation({
    mutationFn: () => assessmentApi.confirmOMRSheet(sheet._id, mcqQuestions.map((q: any) => ({
      questionNumber: q.questionNumber,
      confirmedOption: answers[q.questionNumber],
    }))),
    onSuccess: () => { toast.success("Sheet confirmed — score computed"); onConfirmed(); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to confirm"),
  });

  const studentName = sheet.student ? `${sheet.student.firstName} ${sheet.student.lastName}` : sheet.sheetCode;
  const ambiguousCount = (sheet.detectedAnswers || []).filter((d: any) => d.isAmbiguous || !d.detectedOption).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">← Back to sheets</button>
        <h2 className="text-base font-semibold text-slate-800">Review — {studentName}</h2>
      </div>

      {ambiguousCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4 text-xs text-amber-800">
          <strong>{ambiguousCount} answer{ambiguousCount !== 1 ? "s" : ""} need attention</strong> — either multiple bubbles were detected as filled, or the question was left blank. Review and set each manually before confirming.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500">Q#</span>
          <span className="text-xs font-semibold text-slate-500">Detected</span>
          <span className="text-xs font-semibold text-slate-500">Confidence</span>
          <span className="text-xs font-semibold text-slate-500">Confirm</span>
        </div>
        <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
          {mcqQuestions.map((q: any) => {
            const detected: any = detectedMap.get(q.questionNumber);
            const isIssue = !detected || detected.isAmbiguous || !detected.detectedOption;
            const confirmed = answers[q.questionNumber];

            return (
              <div key={q.questionNumber} className={`grid grid-cols-4 gap-2 items-center px-2 py-1.5 rounded-lg ${isIssue ? "bg-amber-50" : "bg-slate-50/60"}`}>
                <span className="text-xs font-medium text-slate-700">Q{q.questionNumber}</span>
                <span className={`text-xs ${isIssue ? "text-amber-700 font-semibold" : "text-slate-600"}`}>
                  {detected?.isAmbiguous ? "⚠ Multiple" : detected?.detectedOption || "Blank"}
                  {detected && !detected.isAmbiguous && detected.detectedOption && (
                    <span className="text-slate-400 ml-1">({Math.round((detected.confidence || 0) * 100)}%)</span>
                  )}
                </span>
                <span className={`text-xs ${!detected || detected.confidence < 0.5 ? "text-amber-600" : "text-slate-400"}`}>
                  {detected ? `${Math.round((detected.confidence || 0) * 100)}%` : "—"}
                </span>
                <div className="flex gap-1">
                  {["A", "B", "C", "D"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((p) => ({ ...p, [q.questionNumber]: p[q.questionNumber] === opt ? "" : opt }))}
                      className={`w-6 h-6 text-[10px] font-bold rounded-full border transition-all ${confirmed === opt ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-500">
          {Object.values(answers).filter(Boolean).length} of {mcqQuestions.length} answered
        </p>
        <button
          onClick={() => confirmMut.mutate()}
          disabled={confirmMut.isPending}
          className="bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {confirmMut.isPending ? "Confirming…" : "Confirm & Compute Score"}
        </button>
      </div>
    </div>
  );
}
