import { useState } from 'react';
import { useEditor, EditorContent, Mark } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

// A small extension to TextStyle's mark for font-size, the one basic
// formatting option Tiptap's own extension set doesn't ship - everything
// else (bold/italic/underline, bullet/numbered lists) comes straight from
// StarterKit.
const FontSize = Mark.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element: HTMLElement) => element.style.fontSize || null,
          renderHTML: (attributes: { fontSize?: string | null }) => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
});

const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Large', value: '18px' },
  { label: 'X-Large', value: '22px' },
];

const URDU_FONT = "'Noto Nastaliq Urdu', serif";

// The saved value carries its own direction as a wrapper div rather than
// as separate component state, so it round-trips correctly through the
// backend (which trusts/re-sanitizes this exact HTML - see
// renderRichTextField/sanitizeRichText) with no extra field needed on the
// diary schema. LTR is the default and stays unwrapped, matching how a
// plain-text legacy entry already looks.
function unwrapDir(html: string): { dir: 'ltr' | 'rtl'; inner: string } {
  const match = (html || '').match(/^<div dir="rtl">([\s\S]*)<\/div>$/);
  return match ? { dir: 'rtl', inner: match[1] } : { dir: 'ltr', inner: html || '' };
}

function wrapDir(inner: string, dir: 'ltr' | 'rtl'): string {
  if (!inner || inner === '<p></p>') return '';
  return dir === 'rtl' ? `<div dir="rtl">${inner}</div>` : inner;
}

function ToolbarButton({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
        active ? 'bg-[#0C447C] text-white border-[#0C447C]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Basic rich-text editor for Class Diary content: bold/italic/underline,
 * bullet/numbered lists, a font-size dropdown, a one-click Urdu Nastaleeq
 * font toggle, and an LTR/RTL direction toggle for the whole field - the
 * same "dir" a teacher switches to when writing Urdu/Arabic content, so it
 * both displays and reads correctly right-to-left.
 *
 * `value`/`onChange` carry plain HTML (sanitized again server-side
 * regardless, to the same small tag/attribute allowlist this editor
 * produces - see rich-text.util.ts on the backend).
 */
export function RichTextEditor({ value, onChange, placeholder }: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const initial = unwrapDir(value);
  const [dir, setDir] = useState<'ltr' | 'rtl'>(initial.dir);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      TextStyle,
      FontFamily,
      FontSize,
      Underline,
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: initial.inner,
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content focus:outline-none min-h-[72px] px-3 py-2 text-sm',
      },
    },
    onUpdate: ({ editor }) => onChange(wrapDir(editor.getHTML(), dir)),
  });

  function handleDirChange(nextDir: 'ltr' | 'rtl') {
    setDir(nextDir);
    if (editor) onChange(wrapDir(editor.getHTML(), nextDir));
  }

  if (!editor) return null;

  const isUrduFont = editor.isActive('textStyle', { fontFamily: URDU_FONT });

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#0C447C]">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolbarButton>
        <span className="w-px h-5 bg-slate-200 mx-0.5" />
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •≡
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1≡
        </ToolbarButton>
        <span className="w-px h-5 bg-slate-200 mx-0.5" />
        <select
          title="Text size"
          defaultValue=""
          onChange={(e) => {
            const size = e.target.value;
            if (size) editor.chain().focus().setMark('fontSize', { fontSize: size }).run();
            else editor.chain().focus().unsetMark('fontSize').run();
            e.target.value = '';
          }}
          className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-600"
        >
          <option value="">Text size</option>
          {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <ToolbarButton
          title="Urdu Nastaleeq font"
          active={isUrduFont}
          onClick={() => {
            if (isUrduFont) editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(URDU_FONT).run();
          }}
        >
          <span style={{ fontFamily: URDU_FONT }}>اردو</span>
        </ToolbarButton>
        <span className="w-px h-5 bg-slate-200 mx-0.5" />
        <ToolbarButton title="Left to right" active={dir === 'ltr'} onClick={() => handleDirChange('ltr')}>LTR</ToolbarButton>
        <ToolbarButton title="Right to left (Urdu/Arabic)" active={dir === 'rtl'} onClick={() => handleDirChange('rtl')}>RTL</ToolbarButton>
      </div>
      <EditorContent editor={editor} dir={dir} style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }} />
    </div>
  );
}
