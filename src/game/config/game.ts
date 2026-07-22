export const REEL_COUNT = 5;
export const ROW_COUNT = 3;

export const REEL_BUFFER = 2;

const PORTRAIT = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;

export const CELL_WIDTH = 156;
export const CELL_HEIGHT = PORTRAIT ? 208 : 148;
export const REEL_GAP = 8;

export const BOARD_WIDTH = REEL_COUNT * CELL_WIDTH + (REEL_COUNT - 1) * REEL_GAP;
export const BOARD_HEIGHT = ROW_COUNT * CELL_HEIGHT;

export const BOARD_PADDING = PORTRAIT ? 16 : 34;

export const DESIGN_WIDTH = BOARD_WIDTH + BOARD_PADDING * 2;
export const DESIGN_HEIGHT = BOARD_HEIGHT + BOARD_PADDING * 2;

export const STAGE_GUTTER = 14;

export const STRIP_LENGTH = 48;

export const STARTING_BALANCE = 1000;
export const BET = 10;

export interface TimingProfile {
  accelDuration: number;
  spinSpeed: number;
  firstStopDelay: number;
  reelStopStep: number;
  stopTween: number;
  stopLead: number;
  winLineDuration: number;
  settleDelay: number;
  autoplayDelay: number;
}

export const NORMAL_TIMING: TimingProfile = {
  accelDuration: 0.28,
  spinSpeed: 24,
  firstStopDelay: 1.0,
  reelStopStep: 0.28,
  stopTween: 0.45,
  stopLead: 3,
  winLineDuration: 0.9,
  settleDelay: 0.35,
  autoplayDelay: 0.5,
};

export const TURBO_TIMING: TimingProfile = {
  accelDuration: 0.08,
  spinSpeed: 46,
  firstStopDelay: 0.22,
  reelStopStep: 0.06,
  stopTween: 0.18,
  stopLead: 1,
  winLineDuration: 0.28,
  settleDelay: 0.1,
  autoplayDelay: 0.12,
};

export const SKIP_STOP_TWEEN = 0.12;

export const SPLASH_MIN_MS = 2000;
