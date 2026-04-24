import { describe, it, expect, beforeEach } from 'vitest';
import { BookRepository, type PouchLike } from '../repository';
import type { Project, Chapter, Section } from '../types';
import { DEFAULT_PROJECT_CONFIG } from '../types';

// ─── Minimal in-memory mock of PouchDB ───────────────────────────────────────

type PouchDoc = Record<string, unknown> & { _id: string; _rev?: string };

function createMockDb() {
  const store = new Map<string, PouchDoc>();
  let revCounter = 0;

  return {
    allDocs: async ({ include_docs = false }: { include_docs?: boolean } = {}) => ({
      rows: [...store.values()].map((doc) => ({
        id: doc._id,
        key: doc._id,
        value: { rev: doc._rev as string },
        ...(include_docs ? { doc } : {}),
      })),
      total_rows: store.size,
      offset: 0,
    }),
    get: async (id: string) => {
      const doc = store.get(id);
      if (!doc) throw Object.assign(new Error('not_found'), { status: 404 });
      return { ...doc };
    },
    put: async (doc: PouchDoc) => {
      revCounter += 1;
      const rev = `${revCounter}-mock`;
      store.set(doc._id, { ...doc, _rev: rev });
      return { ok: true, id: doc._id, rev };
    },
    remove: async (id: string, _rev: string) => {
      if (!store.has(id)) throw Object.assign(new Error('not_found'), { status: 404 });
      store.delete(id);
      revCounter += 1;
      return { ok: true };
    },
    /** Test helper – direct access to the store. */
    _store: store,
  };
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    _id: 'project_1',
    type: 'project',
    title: 'My Book',
    author: 'Author',
    description: '',
    config: DEFAULT_PROJECT_CONFIG,
    chapterOrder: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  const now = new Date().toISOString();
  return {
    _id: 'chapter_1',
    type: 'chapter',
    projectId: 'project_1',
    title: 'Chapter 1',
    chapterType: 'regular',
    sectionOrder: [],
    languages: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSection(overrides: Partial<Section> = {}): Section {
  const now = new Date().toISOString();
  return {
    _id: 'section_1',
    type: 'section',
    chapterId: 'chapter_1',
    title: 'Section 1',
    languages: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BookRepository', () => {
  let db: ReturnType<typeof createMockDb>;
  let repo: BookRepository;

  beforeEach(() => {
    db = createMockDb();
    repo = new BookRepository(db as unknown as PouchLike);
  });

  // ── Projects ──────────────────────────────────────────────────────────────

  describe('getProjects', () => {
    it('returns an empty list when no projects exist', async () => {
      expect(await repo.getProjects()).toEqual([]);
    });

    it('returns only documents of type "project"', async () => {
      await db.put(makeProject() as unknown as PouchDoc);
      await db.put(makeChapter() as unknown as PouchDoc);
      const projects = await repo.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].title).toBe('My Book');
    });
  });

  describe('getProject', () => {
    it('returns the project for a known id', async () => {
      const saved = await repo.saveProject(makeProject());
      const fetched = await repo.getProject(saved._id);
      expect(fetched.title).toBe('My Book');
    });

    it('throws when the id does not exist', async () => {
      await expect(repo.getProject('missing')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('saveProject', () => {
    it('persists and returns the project with a _rev', async () => {
      const saved = await repo.saveProject(makeProject());
      expect(saved._rev).toBeDefined();
    });

    it('sets updatedAt to the current time', async () => {
      const before = new Date().toISOString();
      const saved = await repo.saveProject(makeProject());
      expect(saved.updatedAt >= before).toBe(true);
    });

    it('does NOT mutate the input object', async () => {
      const original = makeProject();
      const originalUpdatedAt = original.updatedAt;
      await repo.saveProject(original);
      expect(original.updatedAt).toBe(originalUpdatedAt);
    });

    it('is idempotent – saving the same data twice yields the same result', async () => {
      const first = await repo.saveProject(makeProject());
      const second = await repo.saveProject({ ...first });
      expect(second.title).toBe(first.title);
    });
  });

  describe('deleteProject', () => {
    it('removes the project and all its chapters and sections', async () => {
      const project = await repo.saveProject(makeProject());
      const chapter = await repo.saveChapter(makeChapter());
      const section = await repo.saveSection(makeSection());

      expect(db._store.size).toBe(3);
      await repo.deleteProject(project);
      // chapter and section were removed via cascade
      expect(db._store.has(chapter._id)).toBe(false);
      expect(db._store.has(section._id)).toBe(false);
      expect(db._store.has(project._id)).toBe(false);
    });
  });

  // ── Chapters ──────────────────────────────────────────────────────────────

  describe('getChaptersByProject', () => {
    it('returns only chapters for the specified project', async () => {
      await repo.saveChapter(makeChapter({ _id: 'ch_1', projectId: 'project_1' }));
      await repo.saveChapter(makeChapter({ _id: 'ch_2', projectId: 'project_2' }));
      const list = await repo.getChaptersByProject('project_1');
      expect(list).toHaveLength(1);
      expect(list[0]._id).toBe('ch_1');
    });
  });

  describe('saveChapter', () => {
    it('does NOT mutate the input object', async () => {
      const original = makeChapter();
      const originalUpdatedAt = original.updatedAt;
      await repo.saveChapter(original);
      expect(original.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('deleteChapter', () => {
    it('removes the chapter and its sections', async () => {
      const chapter = await repo.saveChapter(makeChapter());
      await repo.saveSection(makeSection());
      await repo.deleteChapter(chapter);
      expect(db._store.has('chapter_1')).toBe(false);
      expect(db._store.has('section_1')).toBe(false);
    });
  });

  // ── Sections ──────────────────────────────────────────────────────────────

  describe('getSectionsByChapter', () => {
    it('returns only sections for the specified chapter', async () => {
      await repo.saveSection(makeSection({ _id: 's_1', chapterId: 'chapter_1' }));
      await repo.saveSection(makeSection({ _id: 's_2', chapterId: 'chapter_2' }));
      const list = await repo.getSectionsByChapter('chapter_1');
      expect(list).toHaveLength(1);
      expect(list[0]._id).toBe('s_1');
    });
  });

  describe('saveSection', () => {
    it('does NOT mutate the input object', async () => {
      const original = makeSection();
      const originalUpdatedAt = original.updatedAt;
      await repo.saveSection(original);
      expect(original.updatedAt).toBe(originalUpdatedAt);
    });
  });

  // ── Static helpers ────────────────────────────────────────────────────────

  describe('BookRepository.generateId', () => {
    it('returns an id with the expected prefix', () => {
      expect(BookRepository.generateId('project')).toMatch(/^project_/);
    });

    it('returns unique ids on repeated calls', () => {
      const ids = new Set(Array.from({ length: 100 }, () => BookRepository.generateId('x')));
      expect(ids.size).toBe(100);
    });
  });
});
