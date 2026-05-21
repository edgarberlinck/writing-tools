import { BookRepository, type PouchLike } from "./repository";
import { LocalStore } from "./localStore";
import { TauriStore } from "./tauriStore";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Application-wide singleton repository.
 * Desktop runtime: SQLite in appDataDir/data/writing-tools.db via Tauri commands.
 * Browser runtime: localStorage fallback.
 */
export const repository = new BookRepository(
  (isTauriRuntime() ? new TauriStore() : new LocalStore()) as PouchLike,
);

export { BookRepository } from "./repository";
