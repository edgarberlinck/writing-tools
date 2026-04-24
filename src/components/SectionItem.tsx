import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { MdDragIndicator } from 'react-icons/md';
import type { Section } from '../db/types';

interface Props {
  section: Section;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export default function SectionItem({ section, isSelected, onSelect, onDelete, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const commit = () => { onRename(draft); setEditing(false); };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 pl-8 pr-2 py-1.5 cursor-pointer group rounded-md mx-2 ${
        isSelected ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
      onClick={() => !editing && onSelect()}
    >
      <button {...attributes} {...listeners} className="text-gray-500 hover:text-gray-300 cursor-grab" onClick={(e) => e.stopPropagation()}>
        <MdDragIndicator className="w-3 h-3" />
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-gray-800 text-white text-xs rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <span className="flex-1 text-xs truncate">§ {section.title}</span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        {editing ? (
          <>
            <button onClick={commit} className="text-green-400 hover:text-green-300"><FiCheck className="w-3 h-3" /></button>
            <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className={isSelected ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-gray-300'}><FiEdit2 className="w-3 h-3" /></button>
            <button onClick={onDelete} className={isSelected ? 'text-indigo-200 hover:text-white' : 'text-gray-500 hover:text-gray-300'}><FiTrash2 className="w-3 h-3" /></button>
          </>
        )}
      </div>
    </div>
  );
}
