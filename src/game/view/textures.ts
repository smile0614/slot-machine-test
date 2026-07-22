import { Container, Graphics, Text, type Renderer, type Texture } from 'pixi.js';
import { CELL_HEIGHT, CELL_WIDTH } from '../config/game';
import { SYMBOLS, type SymbolDef, type SymbolId } from '../config/symbols';

export type SymbolTextures = ReadonlyMap<SymbolId, Texture>;

export const SYMBOL_PADDING = 8;
const PAD = SYMBOL_PADDING;

function drawSymbol(def: SymbolDef): Container {
  const width = CELL_WIDTH - PAD * 2;
  const height = (def.tall ? 2 : 1) * CELL_HEIGHT - PAD * 2;
  const node = new Container();

  node.addChild(
    new Graphics()
      .roundRect(0, 0, width, height, 18)
      .fill({ color: def.color })
      .roundRect(5, 5, width - 10, height - 10, 13)
      .stroke({ width: 3, color: def.accent, alpha: 0.85 }),
  );

  node.addChild(
    new Graphics()
      .roundRect(10, 10, width - 20, height * 0.38, 12)
      .fill({ color: 0xffffff, alpha: 0.12 }),
  );

  const label = new Text({
    text: def.label,
    style: {
      fontFamily: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
      fontSize: def.tall ? 66 : 54,
      fill: def.accent,
      stroke: { color: 0x000000, width: 7, join: 'round' },
      align: 'center',
    },
  });
  label.anchor.set(0.5);
  label.position.set(width / 2, height / 2);
  node.addChild(label);

  return node;
}

export function createSymbolTextures(renderer: Renderer): SymbolTextures {
  const textures = new Map<SymbolId, Texture>();
  for (const def of SYMBOLS) {
    const node = drawSymbol(def);
    textures.set(def.id, renderer.generateTexture({ target: node, resolution: 2 }));
    node.destroy({ children: true });
  }
  return textures;
}
