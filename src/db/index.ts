import PouchDB from 'pouchdb-browser';
import { BookRepository, type PouchLike } from './repository';

/**
 * Application-wide singleton repository backed by PouchDB (IndexedDB in browser).
 * Import `repository` everywhere in the app instead of using db functions directly.
 */
export const repository = new BookRepository(new PouchDB('writing-tools') as unknown as PouchLike);

export { BookRepository } from './repository';
