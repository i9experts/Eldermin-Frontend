// ============================================================
// KNOWLEDGE BASE BUTTON — contextual "?" help trigger + slide-over drawer
// Eldermin ERP
//
// Small, unobtrusive help affordance meant to sit next to a module tab's
// heading (or in its tab bar). Clicking it opens a right-hand drawer
// showing that tab's KB article, with a search box that falls back to
// matching articles from ANY module if the current tab's content isn't
// what the user needed.
// ============================================================

import { useState } from 'react';
import { HelpCircle, X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import kbService, { KbArticle } from '../../services/kb.service';

interface KnowledgeBaseButtonProps {
  /** e.g. "hr" */
  module: string;
  /** e.g. "employees" — must match this module's tab id */
  tabKey: string;
  className?: string;
}

export function KnowledgeBaseButton({ module, tabKey, className = '' }: KnowledgeBaseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Help for this tab"
        aria-label="Open knowledge base help for this tab"
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 text-slate-400 hover:text-[#0C447C] hover:border-[#0C447C] hover:bg-blue-50 transition-colors ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && <KnowledgeBaseDrawer module={module} tabKey={tabKey} onClose={() => setOpen(false)} />}
    </>
  );
}

function KnowledgeBaseDrawer({
  module,
  tabKey,
  onClose,
}: {
  module: string;
  tabKey: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  // When the visitor picks a search result from another module/tab, we
  // switch what the drawer displays without navigating away from the page.
  const [viewing, setViewing] = useState<{ module: string; tabKey: string } | null>(null);

  const activeModule = viewing?.module ?? module;
  const activeTabKey = viewing?.tabKey ?? tabKey;
  const isSearching = query.trim().length > 1;

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['kb-article', activeModule, activeTabKey],
    queryFn: () => kbService.getKbArticle(activeModule, activeTabKey),
  });

  const { data: searchResults = [], isFetching: searchLoading } = useQuery({
    queryKey: ['kb-search', query],
    queryFn: () => kbService.searchKb(query),
    enabled: isSearching,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-[#0C447C]" />
            Knowledge Base
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the knowledge base..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C447C]/20 focus:border-[#0C447C]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isSearching ? (
            <SearchResultsList
              query={query}
              results={searchResults}
              loading={searchLoading}
              onPick={(a) => {
                setViewing({ module: a.module, tabKey: a.tabKey });
                setQuery('');
              }}
            />
          ) : isLoading ? (
            <div className="text-sm text-slate-400">Loading...</div>
          ) : isError || !article ? (
            <div className="text-sm text-slate-400">No help article yet for this tab.</div>
          ) : (
            <ArticleView article={article} />
          )}
        </div>

        {viewing && !isSearching && (
          <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
            <button onClick={() => setViewing(null)} className="text-xs font-medium text-[#0C447C] hover:underline">
              ← Back to this tab's article
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleView({ article }: { article: KbArticle }) {
  return (
    <div>
      <h3 className="text-base font-bold text-slate-900">{article.title}</h3>
      {article.tagline && <p className="text-sm text-slate-500 mt-1">{article.tagline}</p>}
      {article.body && <p className="text-sm text-slate-700 mt-4 leading-relaxed">{article.body}</p>}
      {article.steps?.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">How to use it</h4>
          <ol className="space-y-2.5">
            {article.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0C447C]/10 text-[#0C447C] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function SearchResultsList({
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
  if (loading) return <div className="text-sm text-slate-400">Searching...</div>;
  if (!results.length) return <div className="text-sm text-slate-400">No articles match "{query}".</div>;
  return (
    <ul className="space-y-2">
      {results.map((a) => (
        <li key={`${a.module}-${a.tabKey}`}>
          <button
            onClick={() => onPick(a)}
            className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-100 hover:border-[#0C447C]/30 hover:bg-blue-50/50 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-800">{a.title}</div>
            {a.tagline && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.tagline}</div>}
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mt-1">{a.module}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default KnowledgeBaseButton;
