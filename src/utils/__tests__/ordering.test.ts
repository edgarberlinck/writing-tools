import { describe, it, expect } from 'vitest';
import { sortByOrder, reorderIds } from '../ordering';

const item = (id: string) => ({ _id: id, title: 'x' });

describe('sortByOrder', () => {
  it('sorts items according to the given order list', () => {
    const items = [item('c'), item('a'), item('b')];
    expect(sortByOrder(items, ['a', 'b', 'c']).map((i) => i._id)).toEqual(['a', 'b', 'c']);
  });

  it('appends items whose id is not in the order list', () => {
    const items = [item('x'), item('a'), item('b')];
    const sorted = sortByOrder(items, ['a', 'b']);
    expect(sorted.map((i) => i._id)).toEqual(['a', 'b', 'x']);
  });

  it('returns an empty array for empty input', () => {
    expect(sortByOrder([], ['a', 'b'])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const items = [item('b'), item('a')];
    sortByOrder(items, ['a', 'b']);
    expect(items[0]._id).toBe('b');
  });

  it('handles an empty order list by preserving original order', () => {
    const items = [item('a'), item('b')];
    const sorted = sortByOrder(items, []);
    expect(sorted.map((i) => i._id)).toEqual(['a', 'b']);
  });
});

describe('reorderIds', () => {
  it('moves an item forward in the list', () => {
    expect(reorderIds(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item backward in the list', () => {
    expect(reorderIds(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('no-op when from === to', () => {
    expect(reorderIds(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the original array', () => {
    const ids = ['a', 'b', 'c'];
    reorderIds(ids, 0, 2);
    expect(ids).toEqual(['a', 'b', 'c']);
  });
});
