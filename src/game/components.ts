import type { Container, Sprite } from 'pixi.js';
import type { SymbolId } from './config/symbols';
import type { ReelStrip } from './services/strips';
import type { WinLine } from './services/evaluator';
import type { Rng } from './services/rng';
import type { TimingProfile } from './config/game';

export class Session {
  playerName = '';
  started = false;
  spinsPlayed = 0;
}

export class Wallet {
  constructor(
    public balance: number,
    public bet: number,
  ) { }
  lastWin = 0;
  displayedWin = 0;
}

export const FlowPhase = {
  Idle: 'idle',
  Spinning: 'spinning',
  Evaluate: 'evaluate',
  Present: 'present',
  Settle: 'settle',
} as const;

export type FlowPhase = (typeof FlowPhase)[keyof typeof FlowPhase];

export class GameFlow {
  phase: FlowPhase = FlowPhase.Idle;
  timer = 0;

  grid: SymbolId[][] = [];
  wins: WinLine[] = [];
  totalWin = 0;

  presentIndex = 0;

  spinRequested = false;
  skipRequested = false;
  restartRequested = false;
}

export class Settings {
  turbo = false;
  autoplayRemaining = 0;
  autoplayInfinite = false;

  get autoplayActive(): boolean {
    return this.autoplayInfinite || this.autoplayRemaining > 0;
  }
}

export class Config {
  constructor(
    public readonly rng: Rng,
    public readonly strips: readonly ReelStrip[],
  ) { }
  timing!: TimingProfile;
}

export class Stage {
  constructor(public readonly overlay: Container) { }
}

export class Viewport {
  scale = 1;
  offsetY = 0;
}

export const ReelPhase = {
  Idle: 'idle',
  Accelerating: 'accelerating',
  Spinning: 'spinning',
  Stopping: 'stopping',
} as const;

export type ReelPhase = (typeof ReelPhase)[keyof typeof ReelPhase];

export class Reel {
  constructor(
    public readonly index: number,
    public readonly strip: ReelStrip,
  ) { }

  phase: ReelPhase = ReelPhase.Idle;
  position = 0;
  speed = 0;
  elapsed = 0;
  stopAt = 0;
  targetStop = 0;
  forceStop = false;

  tweenFrom = 0;
  tweenTo = 0;
  tweenTime = 0;
  tweenDuration = 0;
}

export class ReelView {
  constructor(
    public readonly container: Container,
    public readonly sprites: Sprite[],
  ) { }
}
