export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutBack(t: number, overshoot = 1.35): number {
  const c = overshoot;
  const p = t - 1;
  return 1 + (c + 1) * p * p * p + c * p * p;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
