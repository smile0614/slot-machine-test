import { Container, Graphics, Text } from 'pixi.js';
import { System } from '../../ecs';
import { FlowPhase, GameFlow, Stage, Viewport } from '../components';
import { BOARD_PADDING, CELL_HEIGHT, CELL_WIDTH, DESIGN_WIDTH } from '../config/game';
import { symbolDef } from '../config/symbols';
import type { WinLine } from '../services/evaluator';
import { cellCenter } from '../view/board';

const BANNER_FONT = 19;
const BANNER_HEIGHT = 38;
const BANNER_PAD = 22;

export class WinPresentationSystem extends System {
  private readonly layer = new Container();
  private readonly lines = new Graphics();
  private readonly banner = new Container();
  private readonly badge = new Graphics();
  private readonly label = new Text({
    text: '',
    style: {
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: BANNER_FONT,
      fontWeight: 'bold',
      fill: 0xffffff,
    },
  });

  private time = 0;

  override init(): void {
    this.label.anchor.set(0.5);
    this.banner.addChild(this.badge, this.label);
    this.layer.addChild(this.lines, this.banner);
    this.world.singleton(Stage).overlay.addChild(this.layer);
  }

  update(dt: number): void {
    const flow = this.world.singleton(GameFlow);
    this.time += dt;

    const active = flow.phase === FlowPhase.Present && flow.wins.length > 0;
    this.layer.visible = active;
    if (!active) return;

    const shown =
      flow.presentIndex === -1 ? flow.wins : [flow.wins[Math.min(flow.presentIndex, flow.wins.length - 1)]];

    const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(this.time * 9));

    this.lines.clear();
    for (const win of shown) {
      this.drawWin(win, pulse);
    }

    this.drawLabel(shown, flow.totalWin);
  }

  private drawWin(win: WinLine, pulse: number): void {
    const color = win.payline.color;

    for (const [reel, row] of win.cells) {
      const { x, y } = cellCenter(reel, row);
      this.lines
        .roundRect(x - CELL_WIDTH / 2 + 6, y - CELL_HEIGHT / 2 + 6, CELL_WIDTH - 12, CELL_HEIGHT - 12, 14)
        .stroke({ width: 5, color, alpha: pulse });
    }

    const points = win.cells.map(([reel, row]) => cellCenter(reel, row));
    this.lines.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.lines.lineTo(points[i].x, points[i].y);
    this.lines.stroke({ width: 6, color, alpha: 0.35 + 0.35 * pulse, cap: 'round', join: 'round' });
  }

  private drawLabel(shown: readonly WinLine[], total: number): void {
    this.label.text =
      shown.length === 1
        ? `${shown[0].payline.name.toUpperCase()} · ${shown[0].count}× ${symbolDef(shown[0].symbol).label} · +${shown[0].amount}`
        : `${shown.length} LINES · TOTAL +${total}`;

    const viewport = this.world.singleton(Viewport);
    const scale = viewport.scale || 1;
    this.banner.scale.set(1 / scale);

    const half = BANNER_HEIGHT / 2 / scale;
    const preferred = BOARD_PADDING - half - 6 / scale;

    const canvasTop = -viewport.offsetY / scale;
    const lowest = canvasTop + half + 4 / scale;

    this.banner.position.set(DESIGN_WIDTH / 2, Math.max(preferred, lowest));

    const width = this.label.width + BANNER_PAD * 2;
    const height = BANNER_HEIGHT;

    this.badge
      .clear()
      .roundRect(-width / 2, -height / 2, width, height, height / 2)
      .fill({ color: 0x05070f, alpha: 0.88 })
      .stroke({ width: 2, color: shown.length === 1 ? shown[0].payline.color : 0xf5d76e, alpha: 0.95 });

    this.label.position.set(0, 0);
  }
}
