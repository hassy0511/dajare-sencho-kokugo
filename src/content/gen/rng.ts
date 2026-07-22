export interface RandomSource {
  next(): number;
}

export function createSeededRng(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next(): number {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    },
  };
}

export function shuffled<T>(items: readonly T[], rng: RandomSource): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng.next() * (index + 1));
    const value = result[index];
    result[index] = result[swapIndex]!;
    result[swapIndex] = value!;
  }
  return result;
}
