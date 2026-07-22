export const MIN_MATCH = 3;

export const PAYTABLE: Readonly<Record<number, number>> = {
  3: 2,
  4: 5,
  5: 10,
};

export function lineCoefficient(count: number): number {
  return PAYTABLE[count] ?? 0;
}
