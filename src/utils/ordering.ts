/**
 * Sorts an array of items according to an explicit ordered ID list.
 * Items whose ID is not in `orderIds` are appended at the end.
 */
export function sortByOrder<T extends { _id: string }>(
  items: T[],
  orderIds: string[],
): T[] {
  return [...items].sort((a, b) => {
    const ai = orderIds.indexOf(a._id);
    const bi = orderIds.indexOf(b._id);
    const safeA = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const safeB = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return safeA - safeB;
  });
}

/**
 * Moves an item from `fromIndex` to `toIndex` inside an array of IDs,
 * returning a new array without mutating the original.
 */
export function reorderIds(
  ids: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  const result = [...ids];
  result.splice(toIndex, 0, result.splice(fromIndex, 1)[0]);
  return result;
}
