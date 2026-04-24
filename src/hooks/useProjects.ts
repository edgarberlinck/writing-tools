import { useState, useCallback } from 'react';
import { repository } from '../db';
import type { Project } from '../db/types';

export interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  load: () => Promise<void>;
  remove: (project: Project) => Promise<void>;
}

/**
 * Manages the project list for the Home page.
 * All data operations are isolated here so the component stays pure UI.
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await repository.getProjects();
      setProjects(
        [...list].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(
    async (project: Project) => {
      await repository.deleteProject(project);
      await load();
    },
    [load],
  );

  return { projects, loading, load, remove };
}
