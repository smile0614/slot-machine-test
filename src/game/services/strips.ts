import { REEL_COUNT, ROW_COUNT, STRIP_LENGTH } from '../config/game';
import { SYMBOLS, SymbolId, symbolDef } from '../config/symbols';
import type { Rng } from './rng';

export type CellPart = 'single' | 'top' | 'bottom';

export interface StripCell {
  readonly symbol: SymbolId;
  readonly part: CellPart;
}

export interface ReelStrip {
  readonly cells: readonly StripCell[];
  readonly stopPositions: readonly number[];
}

export function mod(value: number, length: number): number {
  return ((value % length) + length) % length;
}

export function buildStrip(rng: Rng, length = STRIP_LENGTH): ReelStrip {
  const weights = SYMBOLS.map((s) => s.weight);
  const cells: StripCell[] = [];

  while (cells.length < length) {
    const id = SYMBOLS[rng.weighted(weights)].id;
    const def = symbolDef(id);
    const remaining = length - cells.length;

    if (def.tall) {
      if (remaining < 2 || cells[cells.length - 1]?.symbol === id) continue;
      cells.push({ symbol: id, part: 'bottom' });
      cells.push({ symbol: id, part: 'top' });
      continue;
    }

    const a = cells[cells.length - 1];
    const b = cells[cells.length - 2];
    if (a?.symbol === id && b?.symbol === id) continue;

    cells.push({ symbol: id, part: 'single' });
  }

  if (cells[0].part === 'top' || cells[cells.length - 1].part === 'bottom') {
    return buildStrip(rng, length);
  }

  const stopPositions: number[] = [];
  for (let p = 0; p < cells.length; p++) {
    const topRow = cells[mod(p, cells.length)];
    const bottomRow = cells[mod(p - (ROW_COUNT - 1), cells.length)];
    if (topRow.part === 'bottom') continue;
    if (bottomRow.part === 'top') continue;
    stopPositions.push(p);
  }

  return { cells, stopPositions };
}

export function buildStrips(rng: Rng): ReelStrip[] {
  return Array.from({ length: REEL_COUNT }, () => buildStrip(rng));
}

export function randomStop(strip: ReelStrip, rng: Rng): number {
  return strip.stopPositions[rng.int(strip.stopPositions.length)];
}

export function readGrid(strips: readonly ReelStrip[], positions: readonly number[]): SymbolId[][] {
  return strips.map((strip, reel) => {
    const p = positions[reel];
    return Array.from(
      { length: ROW_COUNT },
      (_, row) => strip.cells[mod(p - row, strip.cells.length)].symbol,
    );
  });
}
