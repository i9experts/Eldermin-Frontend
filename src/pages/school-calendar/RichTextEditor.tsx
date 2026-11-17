import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { safeParseLocalStorage } from '../../lib/safeParseLocalStorage';

const UPLOAD_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
function uploadAuthHeaders() {
  const token = localStorage.getItem('eldermin_token') || '';
  const schoolSlug = safeParseLocalStorage<{ slug?: string }>('eldermin_institution')?.slug || 'demo-school';
  return { Authorization: `Bearer ${token}`, 'x-school-slug': schoolSlug };
}

// A deliberately small rich-text editor (contentEditable + document.execCommand)
// rather than pulling in Quill/TipTap for one textarea - the circular body
// only needs bold/italic/underline/lists/a link, not a full document editor.
// execCommand is deprecated but still broadly supported for exactly this
// narrow use, and every browser Eldermin actually needs to support (desktop
// Chrome/Edge/Safari, the browsers school admins use) still implements it.
// `imageUploadFolder` is optional - only callers that want an inline image
// button (e.g. Parent Consent, where a permission slip or flyer is often
// attached) pass one; Circulars stays text-only.
export default function RichTextEditor({ value, onChange, placeholder, imageUploadFolder }: { value: string; onChange: (html: string) => void; placeholder?: string; imageUploadFolder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInput = () => {
    const html = ref.current?.innerHTML || '';
    lastValue.current = html;
    onChange(html);
  };

  const insertLink = () => {
    const url = window.prompt('Link URL:');
    if (url) exec('createLink', url);
  };

  async function handleImageFile(file: File) {
    if (!imageUploadFolder) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${UPLOAD_API_BASE}/api/v1/upload/single/${imageUploadFolder}`, {
        method: 'POST', headers: uploadAuthHeaders(), body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const body = await res.json();
      exec('insertImage', body.data.url);
    } catch {
      window.alert('Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }

  const btnCls = 'w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600';

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50">
        <button type="button" onClick={() => exec('bold')} className={btnCls} title="Bold"><Bold size={14} /></button>
        <button type="button" onClick={() => exec('italic')} className={btnCls} title="Italic"><Italic size={14} /></button>
        <button type="button" onClick={() => exec('underline')} className={btnCls} title="Underline"><Underline size={14} /></button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btnCls} title="Bullet list"><List size={14} /></button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={btnCls} title="Numbered list"><ListOrdered size={14} /></button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button type="button" onClick={insertLink} className={btnCls} title="Insert link"><LinkIcon size={14} /></button>
        {imageUploadFolder && (
          <>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
            <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className={btnCls} title="Insert image">
              <ImageIcon size={14} />
            </button>
          </>
        )}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="min-h-[120px] px-3 py-2 text-sm focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"
        suppressContentEditableWarning
      />
    </div>
  );
}
