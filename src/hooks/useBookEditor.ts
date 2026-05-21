import { useState, useCallback, useEffect, useRef } from "react";
import { repository } from "../db";
import type { Project, Chapter, Section, ChapterType } from "../db/types";
import { sortByOrder } from "../utils/ordering";
import { getLocaleContent, setLocaleContent } from "../utils/content";
import { BookRepository } from "../db/repository";

export interface UseBookEditorReturn {
  project: Project | null;
  loading: boolean;
  orderedChapters: Chapter[];
  orderedSections: Record<string, Section[]>;
  selectedChapterId: string | null;
  selectedSectionId: string | null;
  selectedLocale: string;
  selectedChapter: Chapter | null;
  selectedSection: Section | null;
  editorContent: string;
  setSelectedChapterId: (id: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  setSelectedLocale: (locale: string) => void;
  addChapter: (type: ChapterType) => Promise<void>;
  deleteChapter: (chapter: Chapter) => Promise<void>;
  renameChapter: (chapter: Chapter, title: string) => Promise<void>;
  reorderChapters: (newIds: string[]) => Promise<void>;
  addSection: (chapter: Chapter) => Promise<void>;
  deleteSection: (section: Section) => Promise<void>;
  renameSection: (section: Section, title: string) => Promise<void>;
  reorderSections: (chapter: Chapter, newIds: string[]) => Promise<void>;
  /** Debounced: schedules a save 800 ms after the last call. */
  saveContent: (html: string) => void;
  /** Debounced save for an explicit locale (used in split view). */
  saveContentForLocale: (html: string, locale: string) => void;
  /** Returns content for a given locale of the currently selected entity. */
  getContentForLocale: (locale: string) => string;
}

/**
 * Manages all state and operations for the book editor.
 * Keeps the page component as a pure rendering layer.
 */
export function useBookEditor(
  projectId: string | undefined,
): UseBookEditorReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null,
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [selectedLocale, setSelectedLocale] = useState("en");
  const [loading, setLoading] = useState(true);

  // Refs hold the most recent values so debounced callbacks never go stale.
  const stateRef = useRef({
    selectedChapterId,
    selectedSectionId,
    selectedLocale,
    chapters,
    sections,
  });
  useEffect(() => {
    stateRef.current = {
      selectedChapterId,
      selectedSectionId,
      selectedLocale,
      chapters,
      sections,
    };
  });

  // ─── Data loaders ──────────────────────────────────────────────────────

  const loadSections = useCallback(async (chapterId: string) => {
    const list = await repository.getSectionsByChapter(chapterId);
    setSections((prev) => ({ ...prev, [chapterId]: list }));
  }, []);

  const loadChapters = useCallback(
    async (pid: string) => {
      const list = await repository.getChaptersByProject(pid);
      setChapters(list);
      list.forEach((ch) => loadSections(ch._id));
    },
    [loadSections],
  );

  useEffect(() => {
    if (!projectId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    repository
      .getProject(projectId)
      .then((p) => {
        setProject(p);
        return loadChapters(projectId);
      })
      .finally(() => setLoading(false));
  }, [projectId, loadChapters]);

  // ─── Derived values ────────────────────────────────────────────────────

  const orderedChapters = project
    ? sortByOrder(chapters, project.chapterOrder)
    : chapters;

  const orderedSections: Record<string, Section[]> = {};
  orderedChapters.forEach((ch) => {
    orderedSections[ch._id] = sortByOrder(
      sections[ch._id] ?? [],
      ch.sectionOrder,
    );
  });

  const selectedChapter =
    chapters.find((c) => c._id === selectedChapterId) ?? null;
  const selectedSection =
    selectedSectionId && selectedChapterId
      ? ((sections[selectedChapterId] ?? []).find(
          (s) => s._id === selectedSectionId,
        ) ?? null)
      : null;

  const editorContent = getLocaleContent(
    (selectedSection ?? selectedChapter)?.languages ?? [],
    selectedLocale,
  );

  // ─── Chapter operations ────────────────────────────────────────────────

  const addChapter = useCallback(
    async (type: ChapterType) => {
      if (!projectId) {
        return;
      }
      const now = new Date().toISOString();
      const chapter: Chapter = {
        _id: BookRepository.generateId("chapter"),
        type: "chapter",
        projectId,
        title: `New ${type.replace(/_/g, " ")}`,
        chapterType: type,
        sectionOrder: [],
        languages: [],
        createdAt: now,
        updatedAt: now,
      };

      const saved = await repository.saveChapter(chapter);

      // Use the freshest project snapshot to avoid revision conflicts.
      const currentProject =
        (await repository.getProject(projectId).catch(() => null)) ?? project;
      if (!currentProject) {
        throw new Error("project_not_found");
      }

      const nextOrder = currentProject.chapterOrder.includes(saved._id)
        ? currentProject.chapterOrder
        : [...currentProject.chapterOrder, saved._id];

      let savedProject: Project;
      try {
        savedProject = await repository.saveProject({
          ...currentProject,
          chapterOrder: nextOrder,
        });
      } catch {
        // Retry once with a fresh revision when another write won the race.
        const latest = await repository.getProject(projectId);
        const latestOrder = latest.chapterOrder.includes(saved._id)
          ? latest.chapterOrder
          : [...latest.chapterOrder, saved._id];
        savedProject = await repository.saveProject({
          ...latest,
          chapterOrder: latestOrder,
        });
      }

      setProject(savedProject);
      await loadChapters(projectId);
      setSelectedChapterId(saved._id);
      setSelectedSectionId(null);
    },
    [project, projectId, loadChapters],
  );

  const deleteChapter = useCallback(
    async (chapter: Chapter) => {
      if (!project || !projectId) return;
      await repository.deleteChapter(chapter);
      const savedProject = await repository.saveProject({
        ...project,
        chapterOrder: project.chapterOrder.filter((id) => id !== chapter._id),
      });
      setProject(savedProject);
      await loadChapters(projectId);
      if (selectedChapterId === chapter._id) {
        setSelectedChapterId(null);
        setSelectedSectionId(null);
      }
    },
    [project, projectId, loadChapters, selectedChapterId],
  );

  const renameChapter = useCallback(
    async (chapter: Chapter, title: string) => {
      if (!projectId) return;
      await repository.saveChapter({ ...chapter, title });
      await loadChapters(projectId);
    },
    [projectId, loadChapters],
  );

  const reorderChapters = useCallback(
    async (newIds: string[]) => {
      if (!project) return;
      const savedProject = await repository.saveProject({
        ...project,
        chapterOrder: newIds,
      });
      setProject(savedProject);
    },
    [project],
  );

  // ─── Section operations ────────────────────────────────────────────────

  const addSection = useCallback(
    async (chapter: Chapter) => {
      if (!projectId) return;
      const now = new Date().toISOString();
      const section: Section = {
        _id: BookRepository.generateId("section"),
        type: "section",
        chapterId: chapter._id,
        title: "New Section",
        languages: [],
        createdAt: now,
        updatedAt: now,
      };
      const saved = await repository.saveSection(section);
      await repository.saveChapter({
        ...chapter,
        sectionOrder: [...chapter.sectionOrder, saved._id],
      });
      await loadChapters(projectId);
      await loadSections(chapter._id);
      setSelectedChapterId(chapter._id);
      setSelectedSectionId(saved._id);
    },
    [projectId, loadChapters, loadSections],
  );

  const deleteSection = useCallback(
    async (section: Section) => {
      if (!projectId) return;
      const chapter = chapters.find((c) => c._id === section.chapterId);
      if (chapter) {
        await repository.saveChapter({
          ...chapter,
          sectionOrder: chapter.sectionOrder.filter((id) => id !== section._id),
        });
      }
      await repository.deleteSection(section);
      await loadChapters(projectId);
      await loadSections(section.chapterId);
      if (selectedSectionId === section._id) setSelectedSectionId(null);
    },
    [projectId, chapters, loadChapters, loadSections, selectedSectionId],
  );

  const renameSection = useCallback(
    async (section: Section, title: string) => {
      await repository.saveSection({ ...section, title });
      await loadSections(section.chapterId);
    },
    [loadSections],
  );

  const reorderSections = useCallback(
    async (chapter: Chapter, newIds: string[]) => {
      if (!projectId) return;
      await repository.saveChapter({ ...chapter, sectionOrder: newIds });
      await loadChapters(projectId);
      await loadSections(chapter._id);
    },
    [projectId, loadChapters, loadSections],
  );

  // ─── Content save (debounced) ──────────────────────────────────────────

  const saveContent = useCallback(
    async (html: string) => {
      const {
        selectedChapterId: cid,
        selectedSectionId: sid,
        selectedLocale: locale,
        chapters: latestChapters,
        sections: latestSections,
      } = stateRef.current;

      if (!cid) return;
      const chapter = latestChapters.find((c) => c._id === cid);
      if (!chapter) return;

      if (sid) {
        const section = (latestSections[cid] ?? []).find((s) => s._id === sid);
        if (section) {
          await repository.saveSection({
            ...section,
            languages: setLocaleContent(section.languages, locale, html),
          });
          await loadSections(cid);
        }
      } else {
        await repository.saveChapter({
          ...chapter,
          languages: setLocaleContent(chapter.languages, locale, html),
        });
        if (projectId) await loadChapters(projectId);
      }
    },
    [loadChapters, loadSections, projectId],
  ); // stateRef never changes identity

  const saveContentForLocale = useCallback(
    async (html: string, locale: string) => {
      const {
        selectedChapterId: cid,
        selectedSectionId: sid,
        chapters: latestChapters,
        sections: latestSections,
      } = stateRef.current;
      if (!cid) return;
      const chapter = latestChapters.find((c) => c._id === cid);
      if (!chapter) return;
      if (sid) {
        const section = (latestSections[cid] ?? []).find((s) => s._id === sid);
        if (section) {
          await repository.saveSection({
            ...section,
            languages: setLocaleContent(section.languages, locale, html),
          });
          await loadSections(cid);
        }
      } else {
        await repository.saveChapter({
          ...chapter,
          languages: setLocaleContent(chapter.languages, locale, html),
        });
        if (projectId) await loadChapters(projectId);
      }
    },
    [loadChapters, loadSections, projectId],
  );

  const getContentForLocale = useCallback((locale: string): string => {
    const {
      selectedChapterId: cid,
      selectedSectionId: sid,
      chapters: latestChapters,
      sections: latestSections,
    } = stateRef.current;
    if (!cid) return "";
    if (sid) {
      const section = (latestSections[cid] ?? []).find((s) => s._id === sid);
      return getLocaleContent(section?.languages ?? [], locale);
    }
    const chapter = latestChapters.find((c) => c._id === cid);
    return getLocaleContent(chapter?.languages ?? [], locale);
  }, []);

  return {
    project,
    loading,
    orderedChapters,
    orderedSections,
    selectedChapterId,
    selectedSectionId,
    selectedLocale,
    selectedChapter,
    selectedSection,
    editorContent,
    setSelectedChapterId,
    setSelectedSectionId,
    setSelectedLocale,
    addChapter,
    deleteChapter,
    renameChapter,
    reorderChapters,
    addSection,
    deleteSection,
    renameSection,
    reorderSections,
    saveContent,
    saveContentForLocale,
    getContentForLocale,
  };
}
