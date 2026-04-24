import { useEffect, useState } from 'react';
import { FiPlus, FiBook } from 'react-icons/fi';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import { useProjects } from '../hooks/useProjects';
import type { Project } from '../db/types';

export default function Home() {
  const { projects, load, remove } = useProjects();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    await remove(project);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
            <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FiPlus className="w-5 h-5" /> New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400">No projects yet</h2>
            <p className="text-gray-400 mt-1">Create your first book to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="w-5 h-5" /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((p) => (
              <ProjectCard key={p._id} project={p} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {showForm && (
          <ProjectForm onClose={() => setShowForm(false)} onSaved={load} />
        )}
      </div>
    </Layout>
  );
}

