// ============================================================
// KNOWLEDGE BASE — standalone searchable browser
// Eldermin ERP
//
// Full-page KB: sidebar of modules/articles, a search bar, and an
// article detail view. Structured so more modules slot in alongside
// "hr" later — MODULE_LABELS is the only thing that needs a new entry.
// ============================================================

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import kbService, { KbArticle } from '../../services/kb.service';

const MODULE_LABELS: Record<string, string> = {
  hr: 'Staff & HR',
};

function moduleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] || moduleKey;
}

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ module: string; tabKey: string } | null>(null);

  const isSearching = query.trim().length > 1;

  // For now the sidebar is seeded from the "hr" module (the only fully
  // populated one); listKbArticles() with no filter would also pick up
  // any future module's articles automatically as they're added.
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['kb-articles', 'all'],
    queryFn: () => kbService.listKbArticles(),
  });

  const { data: searchResults = [], isFetching: searchLoading } = useQuery({
    queryKey: ['kb-search', query],
    queryFn: () => kbService.searchKb(query),
    enabled: isSearching,
  });

  const grouped = useMemo(() => {
    const byModule = new Map<string, KbArticle[]>();
    for (const a of articles) {
      if (!byModule.has(a.module)) byModule.set(a.module, []);
      byModule.get(a.module)!.push(a);
    }
    return byModule;
  }, [articles]);

  const activeArticle = useMemo(() => {
    if (!selected) return null;
    return articles.find((a) => a.module === selected.module && a.tabKey === selected.tabKey) || null;
  }, [articles, selected]);

  // Default to the first article once the list loads, so the page
  // never opens on a blank detail pane.
  const firstArticle = articles[0];
  const displayed = activeArticle || (!selected ? firstArticle : null);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
            <BookOpen className="w-4 h-4 text-[#0C447C]" />
            Knowledge Base
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all modules..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isSearching ? (
            <SearchResultsSidebar
              query={query}
              results={searchResults}
              loading={searchLoading}
              onPick={(a) => {
                setSelected({ module: a.module, tabKey: a.tabKey });
                setQuery('');
              }}
            />
          ) : isLoading ? (
            <div className="text-sm text-slate-400 px-2 py-4">Loading...</div>
          ) : (
            Array.from(grouped.entries()).map(([moduleKey, moduleArticles]) => (
              <div key={moduleKey} className="mb-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-2 mb-1.5">
                  {moduleLabel(moduleKey)}
                </div>
                <ul className="space-y-0.5">
                  {moduleArticles
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((a) => {
                      const isActive = displayed?.module === a.module && displayed?.tabKey === a.tabKey;
                      return (
                        <li key={a.tabKey}>
                          <button
                            onClick={() => setSelected({ module: a.module, tabKey: a.tabKey })}
                            className={`w-full flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-[#0C447C]/10 text-[#0C447C] font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{a.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail view */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {displayed ? (
          <div className="max-w-2xl mx-auto px-8 py-10">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#0C447C] mb-2">
              {moduleLabel(displayed.module)}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{displayed.title}</h1>
            {displayed.tagline && <p className="text-base text-slate-500 mt-2">{displayed.tagline}</p>}
            {displayed.body && <p className="text-sm text-slate-700 mt-6 leading-relaxed">{displayed.body}</p>}
            {displayed.steps?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">How to use it</h2>
                <ol className="space-y-3">
                  {displayed.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0C447C]/10 text-[#0C447C] text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-400">
            {isLoading ? 'Loading...' : 'Select an article from the sidebar.'}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultsSidebar({
  results,
  loading,
  onPick,
  query,
}: {
  results: KbArticle[];
  loading: boolean;
  onPick: (a: KbArticle) => void;
  query: string;
}) {
  if (loading) return <div className="text-sm text-slate-400 px-2 py-4">Searching...</div>;
  if (!results.length) return <div className="text-sm text-slate-400 px-2 py-4">No articles match "{query}".</div>;
  return (
    <ul className="space-y-1">
      {results.map((a) => (
        <li key={`${a.module}-${a.tabKey}`}>
          <button
            onClick={() => onPick(a)}
            className="w-full text-left px-2 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
          >
            <div className="font-semibold">{a.title}</div>
            <div className="text-[11px] text-slate-400">{moduleLabel(a.module)}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}
