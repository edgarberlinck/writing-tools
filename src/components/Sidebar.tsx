import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FiPlus } from "react-icons/fi";
import type { Chapter, Section, ChapterType } from "../db/types";
import ChapterItem from "./ChapterItem";

interface Props {
  chapters: Chapter[];
  sections: Record<string, Section[]>;
  selectedChapterId: string | null;
  selectedSectionId: string | null;
  onSelectChapter: (id: string) => void;
  onSelectSection: (chapterId: string, sectionId: string) => void;
  onAddChapter: (type: ChapterType) => void;
  onDeleteChapter: (chapter: Chapter) => void;
  onRenameChapter: (chapter: Chapter, title: string) => void;
  onReorderChapters: (ids: string[]) => void;
  onAddSection: (chapter: Chapter) => void;
  onDeleteSection: (section: Section) => void;
  onRenameSection: (section: Section, title: string) => void;
  onReorderSections: (chapter: Chapter, ids: string[]) => void;
}

const CHAPTER_TYPES: { value: ChapterType; label: string }[] = [
  { value: "regular", label: "Regular Chapter" },
  { value: "introduction", label: "Introduction" },
  { value: "about_author", label: "About Author" },
  { value: "epigraph", label: "Epigraph" },
  { value: "foreword", label: "Foreword" },
  { value: "appendix", label: "Appendix" },
];

export default function Sidebar(props: Props) {
  const { chapters, sections, selectedChapterId, selectedSectionId } = props;
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = chapters.findIndex((c) => c._id === active.id);
    const newIdx = chapters.findIndex((c) => c._id === over.id);
    const reordered = [...chapters];
    reordered.splice(newIdx, 0, reordered.splice(oldIdx, 1)[0]);
    props.onReorderChapters(reordered.map((c) => c._id));
  };

  return (
    <div className="w-64 bg-gray-800 flex flex-col h-full border-r border-gray-700 flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Chapters
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map((c) => c._id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.map((chapter) => (
              <ChapterItem
                key={chapter._id}
                chapter={chapter}
                sections={sections[chapter._id] || []}
                isSelected={selectedChapterId === chapter._id}
                selectedSectionId={
                  selectedChapterId === chapter._id ? selectedSectionId : null
                }
                onSelect={() => props.onSelectChapter(chapter._id)}
                onSelectSection={(sid) =>
                  props.onSelectSection(chapter._id, sid)
                }
                onDelete={() => props.onDeleteChapter(chapter)}
                onRename={(t) => props.onRenameChapter(chapter, t)}
                onAddSection={() => props.onAddSection(chapter)}
                onDeleteSection={props.onDeleteSection}
                onRenameSection={props.onRenameSection}
                onReorderSections={(ids) =>
                  props.onReorderSections(chapter, ids)
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="p-3 border-t border-gray-700 relative">
        <button
          onClick={() => setShowTypeMenu((v) => !v)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" /> Add Chapter
        </button>
        {showTypeMenu && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
            {CHAPTER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  props.onAddChapter(t.value);
                  setShowTypeMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
