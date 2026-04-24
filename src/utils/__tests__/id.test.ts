import { describe, it, expect } from 'vitest';
import { generateId } from '../id';

describe('generateId', () => {
  it('includes the given prefix', () => {
    const id = generateId('project');
    expect(id).toMatch(/^project_/);
  });

  it('produces deterministic output when now and rand are injected', () => {
    const id = generateId('chapter', 1000, 0.5);
    expect(id).toBe('chapter_1000_i');
  });

  it('produces unique values for different rand inputs', () => {
    const a = generateId('section', 1000, 0.1);
    const b = generateId('section', 1000, 0.9);
    expect(a).not.toBe(b);
  });

  it('includes a timestamp segment', () => {
    const now = 1700000000000;
    const id = generateId('project', now, 0.5);
    expect(id).toContain(String(now));
  });
});
