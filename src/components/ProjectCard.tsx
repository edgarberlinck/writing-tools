import { useNavigate } from 'react-router-dom';
import { FiBook, FiSettings, FiTrash2, FiCalendar, FiUser } from 'react-icons/fi';
import type { Project } from '../db/types';

interface Props {
  project: Project;
  onDelete: (project: Project) => void;
}

export default function ProjectCard({ project, onDelete }: Props) {
  const navigate = useNavigate();
  const date = new Date(project.updatedAt).toLocaleDateString();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => navigate(`/projects/${project._id}/editor`)}
      >
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FiBook className="text-indigo-600 w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <FiUser className="w-3 h-3" /> {project.author || 'No author'}
          </p>
          {project.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <FiCalendar className="w-3 h-3" /> {date}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/projects/${project._id}/settings`)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Settings"
          >
            <FiSettings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
