// ============================================================
// GUIDED READING — Staff authoring (Phase 2)
// Levels manager + Readers manager (cover/audio upload, keyword tagging).
// Student-facing player (listen/read/tap-keyword) is Phase 3, pending
// check-in with Atiq before it's built.
// Eldermin ERP | React + TypeScript + Tailwind
// ============================================================

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Trash2, Edit2, Image as ImageIcon, Music, X, Library, PlayCircle, BarChart3, Trophy,
} from 'lucide-react';
import { ModuleHeader } from '../../components/layout/ModuleHeader';
import guidedReadingService, {
  uploadReaderCover, uploadReaderAudio,
  type ReadingLevel, type Reader, type ReaderKeyword, type ReaderPage, type GuidedReadingAnalytics,
} from '../../services/guided-reading.service';
import ReaderPlayer from './ReaderPlayer';

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] ${props.className || ''}`} />
);
const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] ${props.className || ''}`} />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] ${props.className || ''}`} />
);

// ── Reading Level editor ─────────────────────────────────────────
const LevelEditor: React.FC<{ level?: ReadingLevel; nextOrder: number; onClose: () => void }> = ({ level, nextOrder, onClose }) => {
  const isEdit = !!level;
  const qc = useQueryClient();
  const [name, setName] = useState(level?.name || '');
  const [description, setDescription] = useState(level?.description || '');
  const [order, setOrder] = useState(level?.order ?? nextOrder);
  const [color, setColor] = useState(level?.color || '#1e3a5f');

  const save = useMutation({
    mutationFn: () => isEdit
      ? guidedReadingService.updateLevel(level!._id, { name, description, order, color })
      : guidedReadingService.createLevel({ name, description, order, color }),
    onSuccess: () => {
      toast.success(isEdit ? 'Level updated' : 'Level created');
      qc.invalidateQueries({ queryKey: ['guided-reading', 'levels'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save level'),
  });

  const submit = () => {
    if (!name.trim()) { toast.error('Enter a level name'); return; }
    save.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Edit Reading Level' : 'New Reading Level'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Name <span className="text-red-500">*</span></label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Level 1" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Description</label>
            <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What readers belong at this level" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Order</label>
              <Input type="number" value={order} onChange={(e) => setOrder(+e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-9 border border-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-5 py-2.5 rounded-lg font-medium">Cancel</button>
          <button onClick={submit} disabled={save.isPending} className="bg-[#1e3a5f] text-white hover:bg-[#16304f] text-xs px-5 py-2.5 rounded-lg font-medium">
            {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Level'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Levels panel ─────────────────────────────────────────────────
const LevelsPanel: React.FC = () => {
  const qc = useQueryClient();
  const { data: levels = [], isLoading } = useQuery<ReadingLevel[]>({
    queryKey: ['guided-reading', 'levels'],
    queryFn: () => guidedReadingService.listLevels(),
  });
  const [editor, setEditor] = useState<{ open: boolean; level?: ReadingLevel }>({ open: false });
  const removeLevel = useMutation({
    mutationFn: (id: string) => guidedReadingService.removeLevel(id),
    onSuccess: () => { toast.success('Level deleted'); qc.invalidateQueries({ queryKey: ['guided-reading', 'levels'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete level'),
  });

  if (isLoading) return <p className="text-sm text-gray-400">Loading levels…</p>;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setEditor({ open: true })} className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg font-medium hover:bg-[#16304f]">
          <Plus size={14} /> Add Level
        </button>
      </div>
      {levels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Library className="mx-auto text-gray-300 mb-2" size={28} />
          <p className="text-sm text-gray-500">No reading levels yet. Add your school's first level to start building the reading ladder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {levels.map((lvl) => (
            <div key={lvl._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lvl.color || '#1e3a5f' }} />
                  <p className="text-sm font-semibold text-gray-800">{lvl.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditor({ open: true, level: lvl })} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-50 rounded-lg"><Edit2 size={13} /></button>
                  <button onClick={() => { if (confirm(`Delete "${lvl.name}"?`)) removeLevel.mutate(lvl._id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Order: {lvl.order}</p>
              {lvl.description && <p className="text-xs text-gray-500 mt-2">{lvl.description}</p>}
            </div>
          ))}
        </div>
      )}
      {editor.open && (
        <LevelEditor level={editor.level} nextOrder={levels.length + 1} onClose={() => setEditor({ open: false })} />
      )}
    </div>
  );
};

// ── Reader editor ─────────────────────────────────────────────────
function emptyKeyword(): ReaderKeyword { return { word: '', meaning: '', example: '' }; }
function emptyPage(n: number): ReaderPage { return { pageNumber: n, text: '' }; }

const ReaderEditor: React.FC<{ reader?: Reader; levels: ReadingLevel[]; onClose: () => void }> = ({ reader, levels, onClose }) => {
  const isEdit = !!reader;
  const qc = useQueryClient();
  const [levelId, setLevelId] = useState(reader?.levelId || levels[0]?._id || '');
  const [title, setTitle] = useState(reader?.title || '');
  const [author, setAuthor] = useState(reader?.author || '');
  const [synopsis, setSynopsis] = useState(reader?.synopsis || '');
  const [coverImageUrl, setCoverImageUrl] = useState(reader?.coverImageUrl || '');
  const [coverImageKey, setCoverImageKey] = useState(reader?.coverImageKey || '');
  const [audioUrl, setAudioUrl] = useState(reader?.audioUrl || '');
  const [audioKey, setAudioKey] = useState(reader?.audioKey || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(reader?.estimatedMinutes);
  const [pages, setPages] = useState<ReaderPage[]>(reader?.pages?.length ? reader.pages : [emptyPage(1)]);
  const [keywords, setKeywords] = useState<ReaderKeyword[]>(reader?.keywords?.length ? reader.keywords : []);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        levelId, title, author, synopsis, coverImageUrl, coverImageKey, audioUrl, audioKey,
        estimatedMinutes, pages: pages.filter((p) => p.text.trim()), keywords: keywords.filter((k) => k.word.trim() && k.meaning.trim()),
      };
      return isEdit ? guidedReadingService.updateReader(reader!._id, payload) : guidedReadingService.createReader(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Reader updated' : 'Reader created');
      qc.invalidateQueries({ queryKey: ['guided-reading', 'readers'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save reader'),
  });

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const result = await uploadReaderCover(file);
      setCoverImageUrl(result.url);
      setCoverImageKey(result.key);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cover upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const result = await uploadReaderAudio(file);
      setAudioUrl(result.url);
      setAudioKey(result.key);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Audio upload failed');
    } finally {
      setUploadingAudio(false);
    }
  };

  const submit = () => {
    if (!levelId) { toast.error('Select a reading level'); return; }
    if (!title.trim()) { toast.error('Enter a title'); return; }
    save.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{isEdit ? 'Edit Reader' : 'New Reader'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Reading Level <span className="text-red-500">*</span></label>
              <Select value={levelId} onChange={(e) => setLevelId(e.target.value)}>
                <option value="">Select Level</option>
                {levels.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Title <span className="text-red-500">*</span></label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Big Apple" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Author</label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Estimated Minutes</label>
              <Input type="number" value={estimatedMinutes ?? ''} onChange={(e) => setEstimatedMinutes(e.target.value === '' ? undefined : +e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Synopsis</label>
            <TextArea rows={2} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Cover Image</label>
              {coverImageUrl && <img src={coverImageUrl} alt="Cover" className="h-20 w-16 object-cover rounded-lg mb-2 border border-gray-100" />}
              <label className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2 w-fit hover:bg-gray-50">
                <ImageIcon size={13} /> {uploadingCover ? 'Uploading…' : coverImageUrl ? 'Replace cover' : 'Upload cover'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Narrated Audio</label>
              {audioUrl && <audio src={audioUrl} controls className="w-full h-9 mb-2" />}
              <label className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2 w-fit hover:bg-gray-50">
                <Music size={13} /> {uploadingAudio ? 'Uploading…' : audioUrl ? 'Replace audio' : 'Upload audio'}
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pages</label>
              <button onClick={() => setPages((prev) => [...prev, emptyPage(prev.length + 1)])} className="flex items-center gap-1 text-xs text-[#1e3a5f] font-medium hover:underline">
                <Plus size={12} /> Add Page
              </button>
            </div>
            <div className="space-y-2">
              {pages.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-start">
                  <div className="col-span-2">
                    <Input type="number" placeholder="Page #" value={p.pageNumber} onChange={(e) => setPages((prev) => prev.map((x, j) => j === i ? { ...x, pageNumber: +e.target.value } : x))} />
                  </div>
                  <div className="col-span-9">
                    <TextArea rows={1} placeholder="Page text" value={p.text} onChange={(e) => setPages((prev) => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                  </div>
                  <div className="col-span-1 flex justify-end pt-1">
                    <button onClick={() => setPages((prev) => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Keywords (tap-to-learn dictionary)</label>
              <button onClick={() => setKeywords((prev) => [...prev, emptyKeyword()])} className="flex items-center gap-1 text-xs text-[#1e3a5f] font-medium hover:underline">
                <Plus size={12} /> Add Keyword
              </button>
            </div>
            <div className="space-y-2">
              {keywords.map((k, i) => (
                <div key={i} className="grid grid-cols-12 gap-1.5 items-start">
                  <div className="col-span-2">
                    <Input placeholder="Word" value={k.word} onChange={(e) => setKeywords((prev) => prev.map((x, j) => j === i ? { ...x, word: e.target.value } : x))} />
                  </div>
                  <div className="col-span-4">
                    <Input placeholder="Meaning" value={k.meaning} onChange={(e) => setKeywords((prev) => prev.map((x, j) => j === i ? { ...x, meaning: e.target.value } : x))} />
                  </div>
                  <div className="col-span-4">
                    <Input placeholder="Example sentence (optional)" value={k.example || ''} onChange={(e) => setKeywords((prev) => prev.map((x, j) => j === i ? { ...x, example: e.target.value } : x))} />
                  </div>
                  <div className="col-span-1">
                    <Input type="number" placeholder="Pg" value={k.pageNumber ?? ''} onChange={(e) => setKeywords((prev) => prev.map((x, j) => j === i ? { ...x, pageNumber: e.target.value === '' ? undefined : +e.target.value } : x))} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setKeywords((prev) => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {keywords.length === 0 && <p className="text-xs text-gray-400">No keywords tagged yet.</p>}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-5 py-2.5 rounded-lg font-medium">Cancel</button>
          <button onClick={submit} disabled={save.isPending} className="bg-[#1e3a5f] text-white hover:bg-[#16304f] text-xs px-5 py-2.5 rounded-lg font-medium">
            {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Reader'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Readers panel ─────────────────────────────────────────────────
const ReadersPanel: React.FC<{ levels: ReadingLevel[] }> = ({ levels }) => {
  const qc = useQueryClient();
  const [levelFilter, setLevelFilter] = useState('');
  const { data: readers = [], isLoading } = useQuery<Reader[]>({
    queryKey: ['guided-reading', 'readers', levelFilter],
    queryFn: () => guidedReadingService.listReaders(levelFilter || undefined),
  });
  const [editor, setEditor] = useState<{ open: boolean; reader?: Reader }>({ open: false });
  const [previewReader, setPreviewReader] = useState<Reader | null>(null);
  const removeReader = useMutation({
    mutationFn: (id: string) => guidedReadingService.removeReader(id),
    onSuccess: () => { toast.success('Reader deleted'); qc.invalidateQueries({ queryKey: ['guided-reading', 'readers'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete reader'),
  });

  const levelName = (id: string) => levels.find((l) => l._id === id)?.name || '—';

  return (
    <div>
      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="w-56">
          <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="">All Levels</option>
            {levels.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </Select>
        </div>
        <button
          onClick={() => { if (levels.length === 0) { toast.error('Add a reading level first'); return; } setEditor({ open: true }); }}
          className="flex items-center gap-1.5 bg-[#1e3a5f] text-white text-xs px-4 py-2 rounded-lg font-medium hover:bg-[#16304f]"
        >
          <Plus size={14} /> Add Reader
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading readers…</p>
      ) : readers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <BookOpen className="mx-auto text-gray-300 mb-2" size={28} />
          <p className="text-sm text-gray-500">No readers yet. Add a book, tag its keywords and upload its narrated audio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {readers.map((r) => (
            <div key={r._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
              {r.coverImageUrl ? (
                <img src={r.coverImageUrl} alt={r.title} className="h-16 w-12 object-cover rounded-md border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="h-16 w-12 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0"><BookOpen size={16} className="text-gray-300" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                <p className="text-xs text-gray-400">{levelName(r.levelId)} {r.author ? `· ${r.author}` : ''}</p>
                <p className="text-xs text-gray-400 mt-1">{r.pages?.length || 0} page(s) · {r.keywords?.length || 0} keyword(s) {r.audioUrl ? '· 🔊' : ''}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => setPreviewReader(r)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Preview Reader"><PlayCircle size={13} /></button>
                  <button onClick={() => setEditor({ open: true, reader: r })} className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-50 rounded-lg"><Edit2 size={13} /></button>
                  <button onClick={() => { if (confirm(`Delete "${r.title}"?`)) removeReader.mutate(r._id); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor.open && <ReaderEditor reader={editor.reader} levels={levels} onClose={() => setEditor({ open: false })} />}
      {previewReader && <ReaderPlayer reader={previewReader} onClose={() => setPreviewReader(null)} />}
    </div>
  );
};

// ── Analytics panel (Phase 5) ─────────────────────────────────────
const AnalyticsPanel: React.FC = () => {
  const { data, isLoading } = useQuery<GuidedReadingAnalytics>({
    queryKey: ['guided-reading', 'analytics'],
    queryFn: () => guidedReadingService.getAnalytics(),
  });

  if (isLoading) return <p className="text-sm text-gray-400">Loading analytics…</p>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Readers', value: data.totalReaders },
          { label: 'Students Assigned', value: data.totalStudentsAssigned },
          { label: 'Completions', value: data.totalCompletions },
          { label: 'Points Awarded', value: data.totalPointsAwarded },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-[#1e3a5f]">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 size={14} className="text-[#1e3a5f]" />
          <p className="text-sm font-semibold text-gray-700">Levels Breakdown</p>
        </div>
        {data.levelBreakdown.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">No reading levels yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.levelBreakdown.map((l) => (
              <div key={l.levelId} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{l.name}</span>
                <span className="text-xs text-gray-400">{l.readerCount} reader(s) · {l.studentsAssigned} student(s) assigned</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Trophy size={14} className="text-amber-500" />
          <p className="text-sm font-semibold text-gray-700">Most Completed Readers</p>
        </div>
        {data.topReaders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">No readers completed yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.topReaders.map((r, i) => (
              <div key={r.readerId} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">{i + 1}. {r.title}</span>
                <span className="text-xs font-semibold text-[#1e3a5f]">{r.completions} completion{r.completions !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function GuidedReadingPage() {
  const [tab, setTab] = useState<'levels' | 'readers' | 'analytics'>('levels');
  const { data: levels = [] } = useQuery<ReadingLevel[]>({
    queryKey: ['guided-reading', 'levels'],
    queryFn: () => guidedReadingService.listLevels(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <ModuleHeader
        icon={BookOpen}
        title="Guided Reading"
        subtitle="School-defined reading levels and readers — listen, read, tap-to-learn keywords, and earn points on completion."
      />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex gap-1 mb-4 bg-white rounded-lg border border-gray-100 p-1 w-fit">
          {(['levels', 'readers', 'analytics'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-[#1e3a5f] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {t === 'levels' ? 'Reading Levels' : t === 'readers' ? 'Readers' : 'Analytics'}
            </button>
          ))}
        </div>
        {tab === 'levels' && <LevelsPanel />}
        {tab === 'readers' && <ReadersPanel levels={levels} />}
        {tab === 'analytics' && <AnalyticsPanel />}
      </div>
    </div>
  );
}
