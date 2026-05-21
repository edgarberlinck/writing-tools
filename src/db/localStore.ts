import type { PouchLike } from "./repository";

type Doc = Record<string, unknown> & { _id: string; _rev?: string };

const STORAGE_KEY = "writing-tools-docs-v1";

function parseRev(rev?: string): number {
  if (!rev) return 0;
  const parsed = Number(rev.split("-")[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class LocalStore implements PouchLike {
  private docs = new Map<string, Doc>();

  constructor() {
    this.load();
  }

  private hasStorage(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined"
    );
  }

  private load() {
    if (!this.hasStorage()) return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Doc[];
      parsed.forEach((doc) => {
        this.docs.set(doc._id, doc);
      });
    } catch {
      this.docs.clear();
    }
  }

  private persist() {
    if (!this.hasStorage()) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...this.docs.values()]),
    );
  }

  async allDocs(_options: { include_docs: true }) {
    return {
      rows: [...this.docs.values()].map((doc) => ({ doc })),
    };
  }

  async get(id: string) {
    const doc = this.docs.get(id);
    if (!doc) {
      throw Object.assign(new Error("not_found"), { status: 404 });
    }
    return { ...doc };
  }

  async put(doc: Record<string, unknown>) {
    const id = String(doc._id ?? "");
    if (!id) {
      throw Object.assign(new Error("missing_id"), { status: 400 });
    }

    const current = this.docs.get(id);
    const providedRev = parseRev(
      typeof doc._rev === "string" ? doc._rev : undefined,
    );
    const currentRev = parseRev(current?._rev);
    if (current && providedRev !== currentRev) {
      throw Object.assign(new Error("conflict"), { status: 409 });
    }

    const nextRev = currentRev + 1;
    const rev = nextRev.toString();
    const nextDoc: Doc = {
      ...(doc as Doc),
      _id: id,
      _rev: rev,
    };

    this.docs.set(id, nextDoc);
    this.persist();
    return { ok: true, id, rev };
  }

  async remove(id: string, rev: string) {
    const current = this.docs.get(id);
    if (!current) {
      throw Object.assign(new Error("not_found"), { status: 404 });
    }
    if (parseRev(rev) !== parseRev(current._rev)) {
      throw Object.assign(new Error("conflict"), { status: 409 });
    }

    this.docs.delete(id);
    this.persist();
    return { ok: true };
  }
}
