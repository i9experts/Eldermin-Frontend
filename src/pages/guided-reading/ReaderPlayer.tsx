// ============================================================
// GUIDED READING — Reader Player (Phase 3, Staff Preview)
// The real listen/read/tap-keyword/complete player, surfaced here as a
// "Preview Reader" mode so staff can see and QA the exact student
// experience. The actual student/parent-facing surface is the separate
// Flutter mobile app (not in this session's repos) talking to the
// /parent-portal/students/:id/reading* routes this component mirrors;
// completion here is a no-op preview, not a real student completion.
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  X, ChevronLeft, ChevronRight, Play, Pause, CheckCircle2, BookOpen,
} from 'lucide-react';
import type { Reader, ReaderKeyword } from '../../services/guided-reading.service';

function highlightKeywords(text: string, keywords: ReaderKeyword[], onTap: (k: ReaderKeyword) => void): React.ReactNode[] {
  if (!keywords.length || !text) return [text];
  const sorted = [...keywords].sort((a, b) => b.word.length - a.word.length);
  const pattern = sorted.map((k) => k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  if (!pattern) return [text];
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const word = match[0];
    const keyword = sorted.find((k) => k.word.toLowerCase() === word.toLowerCase());
    parts.push(
      <button
        key={`kw-${i++}`}
        type="button"
        onClick={() => keyword && onTap(keyword)}
        className="inline font-semibold text-[#1e3a5f] underline decoration-dotted decoration-2 underline-offset-2 hover:bg-amber-50 rounded px-0.5"
      >
        {word}
      </button>,
    );
    lastIndex = match.index + word.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

const ReaderPlayer: React.FC<{ reader: Reader; onClose: () => void }> = ({ reader, onClose }) => {
  const pages = useMemo(() => [...(reader.pages || [])].sort((a, b) => a.pageNumber - b.pageNumber), [reader.pages]);
  const [started, setStarted] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [activeKeyword, setActiveKeyword] = useState<ReaderKeyword | null>(null);
  const [lookedUpWords, setLookedUpWords] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const page = pages[pageIdx];
  const isLastPage = pageIdx === pages.length - 1;

  const handleKeywordTap = (keyword: ReaderKeyword) => {
    setActiveKeyword(keyword);
    setLookedUpWords((prev) => (prev.includes(keyword.word) ? prev : [...prev, keyword.word]));
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleComplete = () => {
    toast.success(`Preview complete — ${lookedUpWords.length} keyword(s) looked up. Points/badges only award for real students in the mobile app.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#1e3a5f]" />
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Preview Mode — not a real student session</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {!started ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
            {reader.coverImageUrl ? (
              <img src={reader.coverImageUrl} alt={reader.title} className="h-40 w-28 object-cover rounded-lg border border-gray-200 shadow-sm mb-4" />
            ) : (
              <div className="h-40 w-28 rounded-lg bg-gray-100 flex items-center justify-center mb-4"><BookOpen size={28} className="text-gray-300" /></div>
            )}
            <h2 className="text-lg font-bold text-gray-800">{reader.title}</h2>
            {reader.author && <p className="text-sm text-gray-400">{reader.author}</p>}
            {reader.synopsis && <p className="text-sm text-gray-500 mt-2 max-w-sm">{reader.synopsis}</p>}
            <p className="text-xs text-gray-400 mt-3">{pages.length} page(s) · {(reader.keywords || []).length} keyword(s) {reader.audioUrl ? '· narrated audio' : ''}</p>
            <button
              onClick={() => setStarted(true)}
              disabled={pages.length === 0}
              className="mt-6 bg-[#1e3a5f] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#16304f] disabled:opacity-40"
            >
              {pages.length === 0 ? 'No pages added yet' : 'Start Reading'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {reader.audioUrl && (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-4">
                  <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                  <audio ref={audioRef} src={reader.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                  <p className="text-xs text-gray-500">Listen along with the narrated audio</p>
                </div>
              )}
              <div className="text-center text-xs font-semibold text-gray-400 mb-2">Page {page?.pageNumber ?? pageIdx + 1} of {pages.length}</div>
              {page?.imageUrl && <img src={page.imageUrl} alt="" className="w-full rounded-lg mb-4 border border-gray-100" />}
              <p className="text-lg leading-relaxed text-gray-800 text-center">
                {page ? highlightKeywords(page.text, reader.keywords || [], handleKeywordTap) : null}
              </p>
            </div>
            <div className="border-t border-gray-100 p-4 flex items-center justify-between">
              <button
                onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                disabled={pageIdx === 0}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              {isLastPage ? (
                <button onClick={handleComplete} className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-5 py-2.5 rounded-lg hover:bg-emerald-700">
                  <CheckCircle2 size={14} /> Mark Complete (Preview)
                </button>
              ) : (
                <button
                  onClick={() => setPageIdx((i) => Math.min(pages.length - 1, i + 1))}
                  className="flex items-center gap-1 text-xs font-medium text-[#1e3a5f] px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>
          </>
        )}

        {activeKeyword && (
          <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={() => setActiveKeyword(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-bold text-[#1e3a5f]">{activeKeyword.word}</p>
              <p className="text-sm text-gray-700 mt-1">{activeKeyword.meaning}</p>
              {activeKeyword.example && <p className="text-xs text-gray-400 italic mt-2">"{activeKeyword.example}"</p>}
              <button onClick={() => setActiveKeyword(null)} className="mt-4 w-full text-xs font-medium text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReaderPlayer;
