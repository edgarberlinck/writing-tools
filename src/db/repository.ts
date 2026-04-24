import type { Project, Chapter, Section } from './types';
import { generateId } from '../utils/id';

/**
 * Minimal interface for PouchDB operations used by BookRepository.
 * Defining it here allows easy mocking in tests.
 */
export interface PouchLike {
  allDocs(options: { include_docs: true }): Promise<{
    rows: Array<{ doc?: Record<string, unknown> }>;
  }>;
  get(id: string): Promise<Record<string, unknown>>;
  put(doc: Record<string, unknown>): Promise<{ ok: boolean; id: string; rev: string }>;
  remove(id: string, rev: string): Promise<{ ok: boolean }>;
}

/**
 * BookRepository encapsulates all database operations.
 * It accepts any `PouchLike` implementation so tests can inject a mock
 * without touching IndexedDB.
 *
 * All write operations are non-mutating: they never modify the caller's
 * object and always return a new document with the updated `_rev`.
 */
export class BookRepository {
  private readonly db: PouchLike;

  constructor(db: PouchLike) {
    this.db = db;
  }

  // ─── Projects ────────────────────────────────────────────────────────────

  async getProjects(): Promise<Project[]> {
    const result = await this.db.allDocs({ include_docs: true });
    return result.rows
      .map((r) => r.doc as unknown as Project)
      .filter((doc) => doc?.type === 'project');
  }

  async getProject(id: string): Promise<Project> {
    return this.db.get(id) as unknown as Promise<Project>;
  }

  async saveProject(data: Project): Promise<Project> {
    const doc = { ...(data as unknown as Record<string, unknown>), updatedAt: new Date().toISOString() };
    const result = await this.db.put(doc);
    return { ...(doc as unknown as Project), _rev: result.rev };
  }

  async deleteProject(project: Project): Promise<void> {
    const chapters = await this.getChaptersByProject(project._id);
    for (const chapter of chapters) {
      await this.deleteChapter(chapter);
    }
    await this.db.remove(project._id, project._rev!);
  }

  // ─── Chapters ────────────────────────────────────────────────────────────

  async getChaptersByProject(projectId: string): Promise<Chapter[]> {
    const result = await this.db.allDocs({ include_docs: true });
    return result.rows
      .map((r) => r.doc as unknown as Chapter)
      .filter((doc) => doc?.type === 'chapter' && doc.projectId === projectId);
  }

  async getChapter(id: string): Promise<Chapter> {
    return this.db.get(id) as unknown as Promise<Chapter>;
  }

  async saveChapter(data: Chapter): Promise<Chapter> {
    const doc = { ...(data as unknown as Record<string, unknown>), updatedAt: new Date().toISOString() };
    const result = await this.db.put(doc);
    return { ...(doc as unknown as Chapter), _rev: result.rev };
  }

  async deleteChapter(chapter: Chapter): Promise<void> {
    const sections = await this.getSectionsByChapter(chapter._id);
    for (const section of sections) {
      await this.deleteSection(section);
    }
    await this.db.remove(chapter._id, chapter._rev!);
  }

  // ─── Sections ────────────────────────────────────────────────────────────

  async getSectionsByChapter(chapterId: string): Promise<Section[]> {
    const result = await this.db.allDocs({ include_docs: true });
    return result.rows
      .map((r) => r.doc as unknown as Section)
      .filter((doc) => doc?.type === 'section' && doc.chapterId === chapterId);
  }

  async getSection(id: string): Promise<Section> {
    return this.db.get(id) as unknown as Promise<Section>;
  }

  async saveSection(data: Section): Promise<Section> {
    const doc = { ...(data as unknown as Record<string, unknown>), updatedAt: new Date().toISOString() };
    const result = await this.db.put(doc);
    return { ...(doc as unknown as Section), _rev: result.rev };
  }

  async deleteSection(section: Section): Promise<void> {
    await this.db.remove(section._id, section._rev!);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Generates a unique document ID with the given type prefix. */
  static generateId(prefix: string): string {
    return generateId(prefix);
  }
}
