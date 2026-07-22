import { PAYLINES, type Payline } from '../config/paylines';
import { MIN_MATCH, lineCoefficient } from '../config/paytable';
import { symbolDef, type SymbolId } from '../config/symbols';

export interface WinLine {
  readonly payline: Payline;
  readonly symbol: SymbolId;
  readonly count: number;
  readonly amount: number;
  readonly cells: ReadonlyArray<readonly [number, number]>;
}

export interface SpinResult {
  readonly grid: SymbolId[][];
  readonly lines: WinLine[];
  readonly total: number;
}

export function evaluate(grid: SymbolId[][], bet: number): SpinResult {
  const lines: WinLine[] = [];

  for (const payline of PAYLINES) {
    const symbol = grid[0][payline.rows[0]];
    const cells: Array<readonly [number, number]> = [[0, payline.rows[0]]];

    for (let reel = 1; reel < payline.rows.length; reel++) {
      const row = payline.rows[reel];
      if (grid[reel][row] !== symbol) break;
      cells.push([reel, row]);
    }

    const count = cells.length;
    if (count < MIN_MATCH) continue;

    const amount = bet * lineCoefficient(count) * symbolDef(symbol).multiplier;
    if (amount <= 0) continue;

    lines.push({ payline, symbol, count, amount, cells });
  }

  lines.sort((a, b) => b.amount - a.amount);
  return { grid, lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}
