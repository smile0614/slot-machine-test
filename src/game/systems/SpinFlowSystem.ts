import { System, type Query } from '../../ecs';
import {
  Config,
  FlowPhase,
  GameFlow,
  Reel,
  ReelPhase,
  Session,
  Settings,
  Wallet,
} from '../components';
import { NORMAL_TIMING, SKIP_STOP_TWEEN, STARTING_BALANCE, TURBO_TIMING } from '../config/game';
import { evaluate } from '../services/evaluator';
import { mod, randomStop, readGrid } from '../services/strips';

export class SpinFlowSystem extends System {
  private reels!: Query;

  override init(): void {
    this.reels = this.world.createQuery({ all: [Reel] });
  }

  update(dt: number): void {
    const flow = this.world.singleton(GameFlow);
    const wallet = this.world.singleton(Wallet);
    const settings = this.world.singleton(Settings);
    const config = this.world.singleton(Config);
    const session = this.world.singleton(Session);

    config.timing = settings.turbo ? TURBO_TIMING : NORMAL_TIMING;

    if (!session.started) {
      flow.spinRequested = false;
      flow.skipRequested = false;
      flow.restartRequested = false;
      return;
    }

    switch (flow.phase) {
      case FlowPhase.Idle:
        this.updateIdle(dt, flow, wallet, settings, session);
        break;
      case FlowPhase.Spinning:
        this.updateSpinning(flow);
        break;
      case FlowPhase.Evaluate:
        this.updateEvaluate(flow, wallet, config);
        break;
      case FlowPhase.Present:
        this.updatePresent(dt, flow, config);
        break;
      case FlowPhase.Settle:
        this.updateSettle(dt, flow, wallet, settings, config);
        break;
    }

    flow.spinRequested = false;
    flow.skipRequested = false;
    flow.restartRequested = false;
  }

  private updateIdle(
    dt: number,
    flow: GameFlow,
    wallet: Wallet,
    settings: Settings,
    session: Session,
  ): void {
    flow.timer -= dt;

    if (flow.restartRequested) {
      this.restart(wallet, settings, session);
      return;
    }

    const affordable = wallet.balance >= wallet.bet;
    if (!affordable) {
      settings.autoplayRemaining = 0;
      settings.autoplayInfinite = false;
      return;
    }

    if (flow.spinRequested) {
      this.startSpin();
      return;
    }

    if (settings.autoplayActive && flow.timer <= 0) {
      if (!settings.autoplayInfinite) settings.autoplayRemaining--;
      this.startSpin();
    }
  }

  private updateSpinning(flow: GameFlow): void {
    if (flow.skipRequested) this.forceStopReels();

    for (const entity of this.reels) {
      if (this.world.get(entity, Reel).phase !== ReelPhase.Idle) return;
    }
    this.enter(flow, FlowPhase.Evaluate);
  }

  private updateEvaluate(flow: GameFlow, wallet: Wallet, config: Config): void {
    const stops = this.reels
      .toArray()
      .map((entity) => this.world.get(entity, Reel))
      .sort((a, b) => a.index - b.index)
      .map((reel) => reel.targetStop);

    const result = evaluate(readGrid(config.strips, stops), wallet.bet);

    flow.grid = result.grid;
    flow.wins = result.lines;
    flow.totalWin = result.total;
    wallet.lastWin = result.total;
    wallet.balance += result.total;

    if (result.lines.length === 0) {
      this.enter(flow, FlowPhase.Settle);
      flow.timer = config.timing.settleDelay;
      return;
    }

    this.enter(flow, FlowPhase.Present);
    flow.presentIndex = 0;
    flow.timer = config.timing.winLineDuration;
  }

  private updatePresent(dt: number, flow: GameFlow, config: Config): void {
    if (flow.skipRequested) {
      if (flow.presentIndex !== -1) {
        flow.presentIndex = -1;
        flow.timer = Math.min(flow.timer, 0.45);
      } else {
        flow.timer = 0;
      }
    }

    flow.timer -= dt;
    if (flow.timer > 0) return;

    if (flow.presentIndex === -1 || flow.presentIndex >= flow.wins.length - 1) {
      this.enter(flow, FlowPhase.Settle);
      flow.timer = config.timing.settleDelay;
      return;
    }

    flow.presentIndex++;
    flow.timer = config.timing.winLineDuration;
  }

  private updateSettle(
    dt: number,
    flow: GameFlow,
    wallet: Wallet,
    settings: Settings,
    config: Config,
  ): void {
    if (flow.skipRequested) flow.timer = 0;
    flow.timer -= dt;
    if (flow.timer > 0) return;

    this.enter(flow, FlowPhase.Idle);
    flow.presentIndex = 0;
    flow.timer = settings.autoplayActive && wallet.balance >= wallet.bet
      ? config.timing.autoplayDelay
      : 0;
  }

  private enter(flow: GameFlow, phase: FlowPhase): void {
    flow.phase = phase;
  }

  private restart(wallet: Wallet, settings: Settings, session: Session): void {
    wallet.balance = STARTING_BALANCE;
    wallet.lastWin = 0;
    wallet.displayedWin = 0;
    session.spinsPlayed = 0;
    settings.autoplayRemaining = 0;
    settings.autoplayInfinite = false;
  }

  private startSpin(): void {
    const flow = this.world.singleton(GameFlow);
    const wallet = this.world.singleton(Wallet);
    const config = this.world.singleton(Config);
    const session = this.world.singleton(Session);

    wallet.balance -= wallet.bet;
    wallet.lastWin = 0;
    wallet.displayedWin = 0;
    session.spinsPlayed++;

    flow.grid = [];
    flow.wins = [];
    flow.totalWin = 0;
    flow.presentIndex = 0;

    for (const entity of this.reels) {
      const reel = this.world.get(entity, Reel);

      reel.targetStop = randomStop(reel.strip, config.rng);
      reel.phase = ReelPhase.Accelerating;
      reel.elapsed = 0;
      reel.speed = 0;
      reel.position = mod(reel.position, reel.strip.cells.length);
    }

    this.enter(flow, FlowPhase.Spinning);
  }

  private forceStopReels(): void {
    for (const entity of this.reels) {
      const reel = this.world.get(entity, Reel);
      if (reel.phase === ReelPhase.Idle) continue;

      if (reel.phase === ReelPhase.Stopping) {
        reel.tweenDuration = Math.min(reel.tweenDuration, reel.tweenTime + SKIP_STOP_TWEEN);
      } else {
        reel.forceStop = true;
      }
    }
  }
}
