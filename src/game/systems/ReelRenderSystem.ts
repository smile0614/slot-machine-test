import { System, type Query } from '../../ecs';
import { Reel, ReelView } from '../components';
import { CELL_HEIGHT } from '../config/game';
import { mod } from '../services/strips';
import { FIRST_SLOT, SLOTS_PER_REEL } from '../view/board';
import { SYMBOL_PADDING, type SymbolTextures } from '../view/textures';

export class ReelRenderSystem extends System {
  private reels!: Query;

  constructor(private readonly textures: SymbolTextures) {
    super();
  }

  override init(): void {
    this.reels = this.world.createQuery({ all: [Reel, ReelView] });
  }

  update(_dt: number): void {
    for (const entity of this.reels) {
      const reel = this.world.get(entity, Reel);
      const view = this.world.get(entity, ReelView);

      const cells = reel.strip.cells;
      const base = Math.floor(reel.position);
      const fraction = reel.position - base;

      for (let slot = 0; slot < SLOTS_PER_REEL; slot++) {
        const k = FIRST_SLOT + slot;
        const cell = cells[mod(base - k, cells.length)];
        const sprite = view.sprites[slot];

        if (cell.part === 'bottom') {
          sprite.visible = false;
          continue;
        }

        sprite.visible = true;
        sprite.texture = this.textures.get(cell.symbol)!;
        sprite.y = (k + fraction) * CELL_HEIGHT + SYMBOL_PADDING;
      }
    }
  }
}
