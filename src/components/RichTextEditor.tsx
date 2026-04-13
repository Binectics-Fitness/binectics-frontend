"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: boolean;
}

function MenuButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-primary-500/20 text-foreground"
          : "text-foreground-secondary hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  maxLength = 3000,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-sm text-foreground",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      // TipTap emits <p></p> for empty content
      const cleaned = html === "<p></p>" ? "" : html;
      if (cleaned.replace(/<[^>]*>/g, "").length <= maxLength) {
        onChange(cleaned);
      }
    },
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== undefined) {
      const isEmpty = !value || value === "<p></p>";
      if (isEmpty && editor.isEmpty) return;
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  if (!editor) return null;

  const charCount = editor.getText().length;

  return (
    <div
      className={`rounded-xl border-2 bg-white overflow-hidden transition-colors ${
        error
          ? "border-red-400"
          : "border-neutral-300 focus-within:border-primary-500"
      }`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 bg-neutral-50">
        <MenuButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </MenuButton>
        <MenuButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </MenuButton>
        <MenuButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <span className="underline">U</span>
        </MenuButton>

        <span className="w-px h-5 bg-neutral-300 mx-1" />

        <MenuButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading"
        >
          H2
        </MenuButton>
        <MenuButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Subheading"
        >
          H3
        </MenuButton>

        <span className="w-px h-5 bg-neutral-300 mx-1" />

        <MenuButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          •&thinsp;List
        </MenuButton>
        <MenuButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1.&thinsp;List
        </MenuButton>

        <span className="w-px h-5 bg-neutral-300 mx-1" />

        <MenuButton
          active={editor.isActive("link")}
          onClick={setLink}
          title="Link"
        >
          🔗
        </MenuButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Character count */}
      <div className="text-right px-3 py-1 text-xs text-foreground-secondary">
        {charCount} / {maxLength}
      </div>
    </div>
  );
}
