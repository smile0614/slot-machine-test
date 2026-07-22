export interface Payline {
  readonly id: number;
  readonly name: string;
  readonly rows: readonly number[];
  readonly color: number;
}

export const PAYLINES: readonly Payline[] = [
  { id: 0, name: 'Top', rows: [0, 0, 0, 0, 0], color: 0xff5c7a },
  { id: 1, name: 'Middle', rows: [1, 1, 1, 1, 1], color: 0x5cc8ff },
  { id: 2, name: 'Bottom', rows: [2, 2, 2, 2, 2], color: 0x9dff5c },
  { id: 3, name: 'V', rows: [0, 1, 2, 1, 0], color: 0xffc75c },
  { id: 4, name: 'Inverse V', rows: [2, 1, 0, 1, 2], color: 0xc98bff },
];
