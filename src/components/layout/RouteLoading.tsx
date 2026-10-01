// Suspense fallback shown while a lazily-loaded route's own JS chunk is
// still downloading (see App.tsx) - without this, a page transition (or
// the very first page load) would show a blank white screen for however
// long that chunk takes, which reads exactly like "the tab isn't opening"
// rather than "it's loading". Deliberately tiny and dependency-free so it
// never itself becomes something that needs to be downloaded first.
export default function RouteLoading() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-slate-200 border-t-[#0C447C] rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading…</p>
      </div>
    </div>
  );
}
