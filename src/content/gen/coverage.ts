import type { RandomSource } from './rng';
import { shuffled } from './rng';

export function selectByCoverage<T>(
  candidates: readonly T[],
  count: number,
  priorityIds: readonly string[],
  rng: RandomSource,
  idsFor: (candidate: T) => readonly string[],
): T[] {
  const pool = shuffled(candidates, rng);
  const selected: T[] = [];
  const uncovered = new Set(priorityIds);

  while (selected.length < count && uncovered.size > 0 && pool.length > 0) {
    let bestIndex = -1;
    let bestCoverage = 0;
    pool.forEach((candidate, index) => {
      const coverage = idsFor(candidate).filter((itemId) => uncovered.has(itemId)).length;
      if (coverage > bestCoverage) {
        bestCoverage = coverage;
        bestIndex = index;
      }
    });
    if (bestIndex < 0) break;
    const [candidate] = pool.splice(bestIndex, 1);
    if (!candidate) break;
    selected.push(candidate);
    idsFor(candidate).forEach((itemId) => uncovered.delete(itemId));
  }

  selected.push(...pool.slice(0, count - selected.length));
  return selected;
}
