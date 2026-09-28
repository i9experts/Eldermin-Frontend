import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import signaturesService from "../../services/signatures.service";
import { SignaturePad } from "../../components/ui/SignaturePad";

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

// Public, unauthenticated recipient-facing signing page - the other half
// of "Send for Signature" (see ESignaturesTab.tsx). Reached via the
// emailed link (or the in-app "Sign Now" flow lands recipients here too,
// same component, same token-based API), so it deliberately carries none
// of the app's Layout/Sidebar chrome - a recipient may have no account at
// all.
export default function ESignPublicPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["esign-public", token],
    queryFn: () => signaturesService.getByToken(token as string),
    enabled: !!token,
    retry: false,
  });

  const [signerName, setSignerName] = useState("");
  const [designation, setDesignation] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [done, setDone] = useState<"signed" | "declined" | null>(null);

  const signMut = useMutation({
    mutationFn: () => signaturesService.signByToken(token as string, { typedName: signerName, designation: designation || undefined, signatureImage: signatureImage || undefined }),
    onSuccess: () => { setDone("signed"); toast.success("Signed successfully"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to sign"),
  });
  const declineMut = useMutation({
    mutationFn: () => signaturesService.declineByToken(token as string, declineReason || undefined),
    onSuccess: () => { setDone("declined"); toast.success("Declined"); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to decline"),
  });

  function submitSign() {
    if (!signerName.trim()) { toast.error("Type your full legal name to sign"); return; }
    signMut.mutate();
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <div className="text-4xl mb-2">🔍</div>
          <div className="font-semibold text-slate-700">This signature link is invalid or has expired</div>
        </div>
      </div>
    );
  }

  const d: any = data;

  if (done === "signed" || d.recipientStatus === "signed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-3">✅</div>
          <div className="text-xl font-bold text-slate-900 mb-1">Signed</div>
          <p className="text-sm text-slate-600">You've signed <strong>{d.documentName}</strong>. A confirmation has been recorded.</p>
        </div>
      </div>
    );
  }
  if (done === "declined" || d.recipientStatus === "declined") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-3">❌</div>
          <div className="text-xl font-bold text-slate-900 mb-1">Declined</div>
          <p className="text-sm text-slate-600">You declined to sign <strong>{d.documentName}</strong>.</p>
        </div>
      </div>
    );
  }
  if (d.requestStatus === "cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <div className="text-4xl mb-2">🚫</div>
          <div className="font-semibold text-slate-700">This signature request was cancelled by the sender.</div>
        </div>
      </div>
    );
  }
  if (d.requestStatus === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <div className="text-4xl mb-2">⚠️</div>
          <div className="font-semibold text-slate-700">Another recipient declined this document — it's no longer awaiting signatures.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Signature Requested</div>
          <h1 className="text-xl font-bold text-slate-900">{d.documentName}</h1>
          <div className="text-sm text-slate-500 mt-1">
            From {d.sentBy}{d.deadline ? ` · Due ${formatDate(d.deadline)}` : ""}
          </div>
          {d.message && <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-600 italic">"{d.message}"</div>}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <iframe src={d.fileUrl} title={d.documentName} className="w-full h-[60vh] bg-white" />
        </div>

        {!d.canSignNow ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
            This document must be signed in order — it's not your turn yet. Check back once earlier recipients have signed.
          </div>
        ) : !declining ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
            <SignaturePad onChange={setSignatureImage} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Full legal name" value={signerName} onChange={(e) => setSignerName(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
              <input placeholder="Designation (optional)" value={designation} onChange={(e) => setDesignation(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            </div>
            <p className="text-xs text-slate-400">By signing, you confirm this is a legally binding electronic signature.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeclining(true)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Decline</button>
              <button onClick={submitSign} disabled={signMut.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#0C447C] rounded-lg hover:bg-[#0b3d6e] disabled:opacity-50">
                {signMut.isPending ? "Signing…" : "✓ Sign Document"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
            <label className="block text-xs font-semibold text-slate-600">Reason for declining (optional)</label>
            <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeclining(false)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Back</button>
              <button onClick={() => declineMut.mutate()} disabled={declineMut.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {declineMut.isPending ? "Declining…" : "Confirm Decline"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
