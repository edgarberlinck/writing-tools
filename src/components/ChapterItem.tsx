import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Chapter, Section } from "../db/types";
import SectionItem from "./SectionItem";

const CHAPTER_TYPE_LABELS: Record<string, string> = {
  regular: "Ch",
  introduction: "Intro",
  about_author: "About",
  epigraph: "Epig",
  foreword: "Fwd",
  appendix: "App",
  moodboard: "Mood",
};

interface Props {
  chapter: Chapter;
  sections: Section[];
  isSelected: boolean;
  selectedSectionId: string | null;
  onSelect: () => void;
  onSelectSection: (id: string) => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onAddSection: () => void;
  onDeleteSection: (s: Section) => void;
  onRenameSection: (s: Section, title: string) => void;
  onReorderSections: (ids: string[]) => void;
}

export default function ChapterItem({
  chapter,
  sections,
  isSelected,
  selectedSectionId,
  onSelect,
  onSelectSection,
  onDelete,
  onRename,
  onAddSection,
  onDeleteSection,
  onRenameSection,
  onReorderSections,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chapter.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex((s) => s._id === active.id);
    const newIdx = sections.findIndex((s) => s._id === over.id);
    const reordered = [...sections];
    reordered.splice(newIdx, 0, reordered.splice(oldIdx, 1)[0]);
    onReorderSections(reordered.map((s) => s._id));
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-1 px-2 py-2 cursor-pointer group rounded-md mx-2 ${
          isSelected && !selectedSectionId
            ? "bg-indigo-600 text-white"
            : "text-gray-200 hover:bg-gray-700"
        }`}
        onClick={() => !editing && onSelect()}
      >
        <button
          {...attributes}
          {...listeners}
          className="text-gray-500 hover:text-gray-300 cursor-grab flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MdDragIndicator className="w-4 h-4" />
        </button>
        <button
          className="flex-shrink-0 text-gray-400 hover:text-gray-200"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? (
            <FiChevronDown className="w-3 h-3" />
          ) : (
            <FiChevronRight className="w-3 h-3" />
          )}
        </button>
        <span
          className={`text-[10px] font-bold px-1 rounded flex-shrink-0 ${isSelected && !selectedSectionId ? "bg-indigo-400" : "bg-gray-600 text-gray-300"}`}
        >
          {CHAPTER_TYPE_LABELS[chapter.chapterType] || "Ch"}
        </span>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-gray-800 text-white text-sm rounded px-1 py-0.5 outline-none min-w-0"
          />
        ) : (
          <span className="flex-1 text-sm truncate min-w-0">
            {chapter.title}
          </span>
        )}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {editing ? (
            <>
              <button
                onClick={commit}
                className="text-green-400 hover:text-green-300"
              >
                <FiCheck className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-red-400 hover:text-red-300"
              >
                <FiX className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-500 hover:text-gray-300"
              >
                <FiEdit2 className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="text-gray-500 hover:text-gray-300"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && chapter.chapterType !== "moodboard" && (
        <div className="mb-1">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s._id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SectionItem
                  key={section._id}
                  section={section}
                  isSelected={selectedSectionId === section._id}
                  onSelect={() => onSelectSection(section._id)}
                  onDelete={() => onDeleteSection(section)}
                  onRename={(t) => onRenameSection(section, t)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSection();
            }}
            className="flex items-center gap-1 pl-10 pr-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-md mx-2 w-full transition-colors"
          >
            <FiPlus className="w-3 h-3" /> Add Section
          </button>
        </div>
      )}
    </div>
  );
}
