export const SymbolId = {
  Cherry: 0,
  Lemon: 1,
  Orange: 2,
  Plum: 3,
  Watermelon: 4,
  Seven: 5,
  Bar: 6,
} as const;

export type SymbolId = (typeof SymbolId)[keyof typeof SymbolId];

export interface SymbolDef {
  readonly id: SymbolId;
  readonly key: string;
  readonly label: string;
  readonly color: number;
  readonly accent: number;
  readonly weight: number;
  readonly multiplier: number;
  readonly tall: boolean;
}

export const SYMBOLS: readonly SymbolDef[] = [
  { id: SymbolId.Cherry, key: 'cherry', label: 'CHR', color: 0xe23c4a, accent: 0xff8b95, weight: 22, multiplier: 1, tall: false },
  { id: SymbolId.Lemon, key: 'lemon', label: 'LEM', color: 0xf2c53d, accent: 0xfff0a8, weight: 20, multiplier: 1, tall: false },
  { id: SymbolId.Orange, key: 'orange', label: 'ORG', color: 0xf08a24, accent: 0xffc78a, weight: 18, multiplier: 1, tall: false },
  { id: SymbolId.Plum, key: 'plum', label: 'PLM', color: 0x8e5cd9, accent: 0xd0b0ff, weight: 14, multiplier: 2, tall: false },
  { id: SymbolId.Watermelon, key: 'watermelon', label: 'WML', color: 0x2fae66, accent: 0x9ff0bf, weight: 12, multiplier: 2, tall: false },
  { id: SymbolId.Seven, key: 'seven', label: '7', color: 0x2f6fe0, accent: 0xa8c8ff, weight: 8, multiplier: 5, tall: false },
  { id: SymbolId.Bar, key: 'bar', label: 'BAR', color: 0x1b1f2e, accent: 0xf5d76e, weight: 6, multiplier: 10, tall: true },
];

export function symbolDef(id: SymbolId): SymbolDef {
  return SYMBOLS[id];
}
