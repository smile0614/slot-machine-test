export interface Rng {
  int(maxExclusive: number): number;
  weighted(weights: readonly number[]): number;
}

export function createRng(seed = (Math.random() * 0xffffffff) >>> 0): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    weighted(weights) {
      let total = 0;
      for (const w of weights) total += w;
      let roll = next() * total;
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll < 0) return i;
      }
      return weights.length - 1;
    },
  };
}
