import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Table as TableIcon, Type, Eraser,
} from 'lucide-react';

export interface CertificateBodyEditorHandle {
  insertToken: (token: string) => void;
}

// Same small contentEditable + document.execCommand approach as
// src/pages/school-calendar/RichTextEditor.tsx (that component's own
// comment explains why: this only needs a handful of real formatting
// tools, not a full Quill/TipTap document editor) - extended with what a
// certificate body specifically needs that a circular doesn't: text
// alignment (a merit certificate centers the recipient's name), a large-
// text toggle (the same "make the name/heading bigger" need), and a
// ready-made key/value table (the standard shape a Transfer Certificate's
// structured fields take). Token insertion is exposed imperatively (see
// CertificateBodyEditorHandle) so the parent's merge-field chip buttons
// can insert into this editor's own live selection.
const CertificateBodyEditor = forwardRef<CertificateBodyEditorHandle, { value: string; onChange: (html: string) => void }>(
  ({ value, onChange }, ref) => {
    const editableRef = useRef<HTMLDivElement>(null);
    // Starts as null (not `value`) specifically so the very first effect
    // run always populates the DOM - an existing template's saved body
    // is already present in `value` at mount (this isn't loaded async),
    // so initializing this to `value` would make the guard below think
    // nothing changed and skip setting innerHTML, leaving the editor
    // showing blank the moment you open it to edit a template.
    const lastValue = useRef<string | null>(null);

    useEffect(() => {
      if (editableRef.current && value !== lastValue.current && document.activeElement !== editableRef.current) {
        editableRef.current.innerHTML = value || '';
        lastValue.current = value;
      }
    }, [value]);

    const handleInput = () => {
      const html = editableRef.current?.innerHTML || '';
      lastValue.current = html;
      onChange(html);
    };

    const exec = (command: string, arg?: string) => {
      editableRef.current?.focus();
      document.execCommand(command, false, arg);
      handleInput();
    };

    const toggleLargeText = () => {
      editableRef.current?.focus();
      // execCommand('fontSize') only offers the ancient 1-7 HTML scale
      // with no clean way to toggle back off - wrapping the selection in
      // a span with a real font-size gives a clean "large text" look
      // (matches the size the preview/backend renderer uses for a
      // centered recipient name) that survives round-tripping through
      // innerHTML the same as any other inline formatting.
      const selected = window.getSelection()?.toString();
      document.execCommand('insertHTML', false, `<span style="font-size:20pt;font-weight:bold;">${selected || 'Large Text'}</span>`);
      handleInput();
    };

    const insertTable = () => {
      editableRef.current?.focus();
      document.execCommand('insertHTML', false, `
        <table>
          <tr><td>Field</td><td>Value</td><td>Field</td><td>Value</td></tr>
          <tr><td>Field</td><td>Value</td><td>Field</td><td>Value</td></tr>
        </table><p><br></p>
      `);
      handleInput();
    };

    useImperativeHandle(ref, () => ({
      insertToken: (token: string) => {
        editableRef.current?.focus();
        document.execCommand('insertHTML', false, `{{${token}}}`);
        handleInput();
      },
    }));

    const btnCls = 'w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600';

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">
          <button type="button" onClick={() => exec('bold')} className={btnCls} title="Bold"><Bold size={14} /></button>
          <button type="button" onClick={() => exec('italic')} className={btnCls} title="Italic"><Italic size={14} /></button>
          <button type="button" onClick={() => exec('underline')} className={btnCls} title="Underline"><Underline size={14} /></button>
          <button type="button" onClick={toggleLargeText} className={btnCls} title="Large text (e.g. a centered recipient name)"><Type size={14} /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button type="button" onClick={() => exec('justifyLeft')} className={btnCls} title="Align left"><AlignLeft size={14} /></button>
          <button type="button" onClick={() => exec('justifyCenter')} className={btnCls} title="Align center"><AlignCenter size={14} /></button>
          <button type="button" onClick={() => exec('justifyRight')} className={btnCls} title="Align right"><AlignRight size={14} /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button type="button" onClick={() => exec('insertUnorderedList')} className={btnCls} title="Bullet list"><List size={14} /></button>
          <button type="button" onClick={() => exec('insertOrderedList')} className={btnCls} title="Numbered list"><ListOrdered size={14} /></button>
          <button type="button" onClick={insertTable} className={btnCls} title="Insert a field/value table (e.g. for a Transfer Certificate)"><TableIcon size={14} /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button type="button" onClick={() => exec('removeFormat')} className={btnCls} title="Clear formatting"><Eraser size={14} /></button>
        </div>
        <div
          ref={editableRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="cert-body-editable min-h-[220px] px-4 py-3 text-sm focus:outline-none"
          suppressContentEditableWarning
        />
        <style>{`
          .cert-body-editable table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          .cert-body-editable table td { border: 1px solid #cbd5e1; padding: 4px 8px; font-size: 12px; }
          .cert-body-editable p { margin: 0 0 8px; }
        `}</style>
      </div>
    );
  },
);
CertificateBodyEditor.displayName = 'CertificateBodyEditor';

export default CertificateBodyEditor;
