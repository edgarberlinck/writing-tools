import type { Editor } from "@tiptap/react";
import { FiBold, FiItalic, FiUnderline } from "react-icons/fi";
import { MdFormatStrikethrough, MdFormatQuote } from "react-icons/md";
import type { ReactNode } from "react";

interface Props {
  editor: Editor | null;
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (
    active: boolean,
    onClick: () => void,
    title: string,
    icon: ReactNode,
  ) => (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded text-sm transition-colors ${
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 p-2 border-b border-gray-200 bg-white flex-wrap">
      <select
        className="text-sm border border-gray-300 rounded px-2 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onChange={(e) => {
          const val = e.target.value;
          if (val === "h1")
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          else if (val === "h2")
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          else if (val === "h3")
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          else if (val === "blockquote")
            editor.chain().focus().toggleBlockquote().run();
          else editor.chain().focus().setParagraph().run();
        }}
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
                ? "h3"
                : editor.isActive("blockquote")
                  ? "blockquote"
                  : "paragraph"
        }
      >
        <option value="paragraph">Body</option>
        <option value="h1">Title (H1)</option>
        <option value="h2">Subtitle (H2)</option>
        <option value="h3">Section (H3)</option>
        <option value="blockquote">Quotation</option>
      </select>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {btn(
        editor.isActive("bold"),
        () => editor.chain().focus().toggleBold().run(),
        "Bold",
        <FiBold className="w-4 h-4" />,
      )}
      {btn(
        editor.isActive("italic"),
        () => editor.chain().focus().toggleItalic().run(),
        "Italic",
        <FiItalic className="w-4 h-4" />,
      )}
      {btn(
        editor.isActive("underline"),
        () => editor.chain().focus().toggleUnderline().run(),
        "Underline",
        <FiUnderline className="w-4 h-4" />,
      )}
      {btn(
        editor.isActive("strike"),
        () => editor.chain().focus().toggleStrike().run(),
        "Strike",
        <MdFormatStrikethrough className="w-4 h-4" />,
      )}
      {btn(
        editor.isActive("blockquote"),
        () => editor.chain().focus().toggleBlockquote().run(),
        "Blockquote",
        <MdFormatQuote className="w-4 h-4" />,
      )}

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-2 rounded text-sm transition-colors ${editor.isActive({ textAlign: "left" }) ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
        title="Align Left"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h10M4 18h12"
          />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-2 rounded text-sm transition-colors ${editor.isActive({ textAlign: "center" }) ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
        title="Align Center"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M7 12h10M6 18h12"
          />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-2 rounded text-sm transition-colors ${editor.isActive({ textAlign: "right" }) ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}
        title="Align Right"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M10 12h10M8 18h12"
          />
        </svg>
      </button>
    </div>
  );
}
