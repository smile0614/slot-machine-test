import { Container, Graphics, Sprite } from 'pixi.js';
import type { World } from '../../ecs';
import { Reel, ReelView } from '../components';
import {
  BOARD_HEIGHT,
  BOARD_PADDING,
  BOARD_WIDTH,
  CELL_HEIGHT,
  CELL_WIDTH,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  REEL_BUFFER,
  REEL_GAP,
  ROW_COUNT,
} from '../config/game';
import { randomStop, type ReelStrip } from '../services/strips';
import type { Rng } from '../services/rng';

export interface BoardLayers {
  root: Container;
  overlay: Container;
}

export const FIRST_SLOT = -REEL_BUFFER;
export const SLOTS_PER_REEL = ROW_COUNT + REEL_BUFFER * 2;

function reelX(index: number): number {
  return BOARD_PADDING + index * (CELL_WIDTH + REEL_GAP);
}

export function cellCenter(reel: number, row: number): { x: number; y: number } {
  return {
    x: reelX(reel) + CELL_WIDTH / 2,
    y: BOARD_PADDING + row * CELL_HEIGHT + CELL_HEIGHT / 2,
  };
}

export function createBoard(world: World, strips: readonly ReelStrip[], rng: Rng): BoardLayers {
  const root = new Container();

  root.addChild(
    new Graphics()
      .roundRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, 28)
      .fill({ color: 0x151a2e })
      .roundRect(6, 6, DESIGN_WIDTH - 12, DESIGN_HEIGHT - 12, 24)
      .stroke({ width: 3, color: 0x3b4670 })
      .roundRect(BOARD_PADDING - 10, BOARD_PADDING - 10, BOARD_WIDTH + 20, BOARD_HEIGHT + 20, 18)
      .fill({ color: 0x0a0d1a }),
  );

  const board = new Container();
  root.addChild(board);

  for (let i = 0; i < strips.length; i++) {
    const container = new Container();
    container.position.set(reelX(i), BOARD_PADDING);

    container.addChild(
      new Graphics().roundRect(0, 0, CELL_WIDTH, BOARD_HEIGHT, 12).fill({ color: 0x11162a }),
    );

    const sprites: Sprite[] = [];
    for (let s = 0; s < SLOTS_PER_REEL; s++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5, 0);
      sprite.x = CELL_WIDTH / 2;
      container.addChild(sprite);
      sprites.push(sprite);
    }

    const mask = new Graphics().roundRect(0, 0, CELL_WIDTH, BOARD_HEIGHT, 12).fill({ color: 0xffffff });
    container.addChild(mask);
    container.mask = mask;

    board.addChild(container);

    const reel = new Reel(i, strips[i]);
    reel.targetStop = randomStop(reel.strip, rng);
    reel.position = reel.targetStop;

    const entity = world.createEntity();
    world.addComponent(entity, reel);
    world.addComponent(entity, new ReelView(container, sprites));
  }

  const grid = new Graphics();
  for (let row = 1; row < ROW_COUNT; row++) {
    const y = BOARD_PADDING + row * CELL_HEIGHT;
    grid.moveTo(BOARD_PADDING, y).lineTo(BOARD_PADDING + BOARD_WIDTH, y);
  }
  grid.stroke({ width: 2, color: 0x000000, alpha: 0.35 });
  root.addChild(grid);

  const overlay = new Container();
  root.addChild(overlay);

  return { root, overlay };
}
