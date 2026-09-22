import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

// A deliberately small rich-text editor (contentEditable + document.execCommand)
// rather than pulling in Quill/TipTap for one textarea - the circular body
// only needs bold/italic/underline/lists/a link, not a full document editor.
// execCommand is deprecated but still broadly supported for exactly this
// narrow use, and every browser Eldermin actually needs to support (desktop
// Chrome/Edge/Safari, the browsers school admins use) still implements it.
export default function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

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
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="min-h-[120px] px-3 py-2 text-sm focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
        suppressContentEditableWarning
      />
    </div>
  );
}
