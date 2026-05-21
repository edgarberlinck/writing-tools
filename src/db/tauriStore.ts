import { invoke } from "@tauri-apps/api/core";
import type { PouchLike } from "./repository";
import { LocalStore } from "./localStore";

type AllDocsResponse = {
  rows: Array<{ doc?: Record<string, unknown> }>;
};

type PutResponse = { ok: boolean; id: string; rev: string };
type RemoveResponse = { ok: boolean };

export class TauriStore implements PouchLike {
  private fallback = new LocalStore();
  private useFallback = false;

  private async run<T>(
    op: string,
    action: () => Promise<T>,
    fallbackAction: () => Promise<T>,
  ): Promise<T> {
    if (this.useFallback) {
      return fallbackAction();
    }

    try {
      return await action();
    } catch (error) {
      this.useFallback = true;
      console.warn(`[db] switching to LocalStore (${op})`, error);
      return fallbackAction();
    }
  }

  async allDocs(options: { include_docs: true }): Promise<AllDocsResponse> {
    if (!options.include_docs) {
      return { rows: [] };
    }
    return this.run(
      "allDocs",
      () => invoke<AllDocsResponse>("db_all_docs"),
      () => this.fallback.allDocs(options),
    );
  }

  async get(id: string): Promise<Record<string, unknown>> {
    return this.run(
      "get",
      () => invoke<Record<string, unknown>>("db_get", { id }),
      () => this.fallback.get(id),
    );
  }

  async put(doc: Record<string, unknown>): Promise<PutResponse> {
    return this.run(
      "put",
      () => invoke<PutResponse>("db_put", { doc }),
      () => this.fallback.put(doc),
    );
  }

  async remove(id: string, rev: string): Promise<RemoveResponse> {
    return this.run(
      "remove",
      () => invoke<RemoveResponse>("db_remove", { id, rev }),
      () => this.fallback.remove(id, rev),
    );
  }
}
