import { Application } from 'pixi.js';

import { World } from './ecs';
import {
  Config,
  GameFlow,
  Reel,
  Session,
  Settings,
  Stage,
  Viewport,
  Wallet,
} from './game/components';
import {
  BET,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  NORMAL_TIMING,
  SPLASH_MIN_MS,
  STAGE_GUTTER,
  STARTING_BALANCE,
} from './game/config/game';
import { createRng } from './game/services/rng';
import { buildStrips } from './game/services/strips';
import { loadSession } from './game/services/storage';
import { HudSystem } from './game/systems/HudSystem';
import { ReelRenderSystem } from './game/systems/ReelRenderSystem';
import { ReelSpinSystem } from './game/systems/ReelSpinSystem';
import { SpinFlowSystem } from './game/systems/SpinFlowSystem';
import { WinPresentationSystem } from './game/systems/WinPresentationSystem';
import { queryUi, setModalOpen } from './game/ui/dom';
import { createBoard } from './game/view/board';
import { createSymbolTextures } from './game/view/textures';

async function boot(): Promise<void> {
  const ui = queryUi();

  const app = new Application();
  await app.init({
    background: 0x070912,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  ui.stage.appendChild(app.canvas);

  const world = new World();

  const rng = createRng();
  const strips = buildStrips(rng);

  const config = world.setSingleton(new Config(rng, strips));
  config.timing = NORMAL_TIMING;

  const session = world.setSingleton(new Session());
  const wallet = world.setSingleton(new Wallet(STARTING_BALANCE, BET));
  world.setSingleton(new GameFlow());
  world.setSingleton(new Settings());

  const { root, overlay } = createBoard(world, strips, rng);
  app.stage.addChild(root);
  world.setSingleton(new Stage(overlay));
  const viewport = world.setSingleton(new Viewport());

  const stored = loadSession();
  if (stored) {
    session.playerName = stored.playerName;
    session.started = true;
    wallet.balance = stored.balance;
  } else {
    setModalOpen(ui.modalName, true);
    ui.inputName.focus();
  }

  world
    .addSystem(new SpinFlowSystem())
    .addSystem(new ReelSpinSystem())
    .addSystem(new ReelRenderSystem(createSymbolTextures(app.renderer)))
    .addSystem(new WinPresentationSystem())
    .addSystem(new HudSystem(ui));

  const resize = (): void => {
    const width = ui.stage.clientWidth;
    const height = ui.stage.clientHeight;
    if (width <= 0 || height <= 0) return;

    app.renderer.resize(width, height);

    const gutter = Math.min(STAGE_GUTTER, width / 6, height / 6);
    const scale = Math.min(
      (width - gutter * 2) / DESIGN_WIDTH,
      (height - gutter * 2) / DESIGN_HEIGHT,
    );

    root.scale.set(scale);
    root.position.set((width - DESIGN_WIDTH * scale) / 2, (height - DESIGN_HEIGHT * scale) / 2);
    viewport.scale = scale;
    viewport.offsetY = root.position.y;
  };

  new ResizeObserver(resize).observe(ui.stage);
  window.addEventListener('orientationchange', resize);
  resize();

  if (import.meta.env.DEV) {
    (globalThis as Record<string, unknown>).__slots = {
      app,
      world,
      root,
      config,
      components: { Session, Wallet, GameFlow, Settings, Config, Stage, Reel, Viewport },
    };
  }

  world.update(0);
  app.render();
  performance.mark('slots:ready');

  await holdSplash(SPLASH_MIN_MS);
  dismissSplash();
  performance.mark('slots:revealed');

  app.ticker.add((ticker) => {
    world.update(Math.min(ticker.deltaMS / 1000, 0.05));
  });
}

function holdSplash(minMs: number): Promise<void> {
  const remaining = minMs - performance.now();
  if (remaining <= 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, remaining));
}

function dismissSplash(): void {
  const splash = document.getElementById('boot');
  if (!splash) return;
  splash.classList.add('is-done');
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });
  window.setTimeout(() => splash.remove(), 600);
}

function reportBootFailure(error: unknown): void {
  console.error(error);
  const box = document.getElementById('boot-error');
  if (box) {
    box.textContent = `Failed to start: ${error instanceof Error ? error.message : String(error)}`;
  }
}

void boot().catch(reportBootFailure);
