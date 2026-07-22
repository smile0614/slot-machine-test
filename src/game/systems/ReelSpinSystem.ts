import { System, type Query } from '../../ecs';
import { Config, Reel, ReelPhase } from '../components';
import { SKIP_STOP_TWEEN, type TimingProfile } from '../config/game';
import { clamp01, easeInQuad, easeOutBack, lerp } from '../services/easing';
import { mod } from '../services/strips';

export class ReelSpinSystem extends System {
  private reels!: Query;

  override init(): void {
    this.reels = this.world.createQuery({ all: [Reel] });
  }

  update(dt: number): void {
    const timing = this.world.singleton(Config).timing;

    for (const entity of this.reels) {
      const reel = this.world.get(entity, Reel);

      switch (reel.phase) {
        case ReelPhase.Accelerating:
        case ReelPhase.Spinning:
          this.advance(reel, dt, timing);
          break;
        case ReelPhase.Stopping:
          this.settle(reel, dt);
          break;
        case ReelPhase.Idle:
          break;
      }
    }
  }

  private advance(reel: Reel, dt: number, timing: TimingProfile): void {
    reel.elapsed += dt;

    if (reel.phase === ReelPhase.Accelerating) {
      const t = clamp01(reel.elapsed / timing.accelDuration);
      reel.speed = timing.spinSpeed * easeInQuad(t);
      if (t >= 1) reel.phase = ReelPhase.Spinning;
    } else {
      reel.speed = timing.spinSpeed;
    }

    reel.position += reel.speed * dt;

    const stopAt = timing.firstStopDelay + reel.index * timing.reelStopStep;
    if (reel.forceStop) {
      reel.forceStop = false;
      this.beginStop(reel, 1, SKIP_STOP_TWEEN);
    } else if (reel.elapsed >= stopAt) {
      this.beginStop(reel, timing.stopLead, timing.stopTween);
    }
  }

  private beginStop(reel: Reel, lead: number, duration: number): void {
    const length = reel.strip.cells.length;
    const base = Math.ceil(reel.position + lead);

    reel.tweenFrom = reel.position;
    reel.tweenTo = base + mod(reel.targetStop - base, length);
    reel.tweenTime = 0;
    reel.tweenDuration = duration;
    reel.phase = ReelPhase.Stopping;
  }

  private settle(reel: Reel, dt: number): void {
    reel.tweenTime += dt;
    const t = clamp01(reel.tweenTime / reel.tweenDuration);

    reel.position = lerp(reel.tweenFrom, reel.tweenTo, easeOutBack(t));

    if (t >= 1) {
      reel.position = reel.tweenTo;
      reel.speed = 0;
      reel.forceStop = false;
      reel.phase = ReelPhase.Idle;
    }
  }
}
