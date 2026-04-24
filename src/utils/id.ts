/**
 * Generates a unique document ID with a type prefix.
 * Accepts injected `now` and `rand` values for deterministic testing.
 */
export function generateId(
  prefix: string,
  now: number = Date.now(),
  rand: number = Math.random(),
): string {
  return `${prefix}_${now}_${rand.toString(36).slice(2, 9)}`;
}
