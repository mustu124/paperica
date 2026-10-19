"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link as LinkIcon, List, ListOrdered, Minus, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/cn";

// Links may point at pages ("/shipping-policy"), the web, email, phone, or a {{token}}
// such as {{whatsapp_url}} — tokens aren't URLs, so the default validation would drop them.
const ALLOWED_HREF = /^(https?:\/\/|mailto:|tel:|\/|#|\{\{)/;

/** Simple rich-text editor (headings, bold, italic, lists, links, rule) that edits HTML. */
export function RichText({ value, onChange, minHeight = "min-h-48" }: { value: string; onChange: (html: string) => void; minHeight?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: true,
          isAllowedUri: (url) => ALLOWED_HREF.test(url),
          HTMLAttributes: { rel: null, target: null },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn("prose-paperica max-w-none px-4 py-3 text-base focus:outline-none", minHeight),
      },
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            link: e.isActive("link"),
          }
        : null,
  });

  const btn = (active: boolean | undefined) =>
    cn("flex size-11 items-center justify-center rounded hover:bg-blush/60 lg:size-8", active && "bg-blush text-chilli-deep");

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link address (e.g. /shipping-policy, https://…, mailto:…, {{whatsapp_url}}). Leave empty to remove.", previous ?? "");
    if (href === null) return;
    if (href.trim() === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else if (ALLOWED_HREF.test(href.trim())) editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
    else window.alert("Links must start with /, https://, mailto:, tel: or {{");
  };

  return (
    <div className="overflow-hidden rounded-md border border-ink/25 bg-white focus-within:border-chilli">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-taupe bg-paper/40 p-1">
        <button type="button" className={btn(state?.h2)} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="Heading" aria-pressed={state?.h2}>
          <Heading2 className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(state?.h3)} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} aria-label="Subheading" aria-pressed={state?.h3}>
          <Heading3 className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(state?.bold)} onClick={() => editor?.chain().focus().toggleBold().run()} aria-label="Bold" aria-pressed={state?.bold}>
          <Bold className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(state?.italic)} onClick={() => editor?.chain().focus().toggleItalic().run()} aria-label="Italic" aria-pressed={state?.italic}>
          <Italic className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(state?.bullet)} onClick={() => editor?.chain().focus().toggleBulletList().run()} aria-label="Bulleted list" aria-pressed={state?.bullet}>
          <List className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(state?.ordered)} onClick={() => editor?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list" aria-pressed={state?.ordered}>
          <ListOrdered className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(state?.link)} onClick={setLink} aria-label="Link" aria-pressed={state?.link}>
          <LinkIcon className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().setHorizontalRule().run()} aria-label="Divider">
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="mx-1 w-px bg-taupe" />
        <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().undo().run()} aria-label="Undo">
          <Undo2 className="size-4" aria-hidden />
        </button>
        <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().redo().run()} aria-label="Redo">
          <Redo2 className="size-4" aria-hidden />
        </button>
      </div>
      {/* Reserve the editor's height until it mounts (it renders client-side only). */}
      {editor ? <EditorContent editor={editor} /> : <div className={cn("px-4 py-3", minHeight)} aria-hidden />}
    </div>
  );
}
