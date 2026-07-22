import { System } from '../../ecs';
import { FlowPhase, GameFlow, Session, Settings, Wallet } from '../components';
import { saveSession } from '../services/storage';
import { renderPaytable, setModalOpen, type UiRefs } from '../ui/dom';

export class HudSystem extends System {
  private lastSavedBalance = -1;

  constructor(private readonly ui: UiRefs) {
    super();
  }

  override init(): void {
    const flow = this.world.singleton(GameFlow);
    const settings = this.world.singleton(Settings);
    const wallet = this.world.singleton(Wallet);
    const session = this.world.singleton(Session);

    renderPaytable(this.ui.paytableBody, wallet.bet);

    this.ui.formName.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = this.ui.inputName.value.trim();
      if (!name) return;
      session.playerName = name;
      session.started = true;
      setModalOpen(this.ui.modalName, false);
      saveSession({ playerName: name, balance: wallet.balance });
    });

    this.ui.btnSpin.addEventListener('click', () => {
      if (settings.autoplayActive) {
        settings.autoplayRemaining = 0;
        settings.autoplayInfinite = false;
        return;
      }
      if (flow.phase === FlowPhase.Idle) flow.spinRequested = true;
      else flow.skipRequested = true;
    });

    this.ui.stage.addEventListener('pointerdown', () => {
      if (session.started && flow.phase !== FlowPhase.Idle) flow.skipRequested = true;
    });

    window.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      if (!session.started) return;
      if (this.ui.modalPaytable.dataset.open === 'true') return;
      if (this.ui.modalBroke.dataset.open === 'true') {
        event.preventDefault();
        flow.restartRequested = true;
        return;
      }
      event.preventDefault();
      if (flow.phase === FlowPhase.Idle) flow.spinRequested = true;
      else flow.skipRequested = true;
    });

    this.ui.btnTurbo.addEventListener('click', () => {
      settings.turbo = !settings.turbo;
    });

    this.ui.btnAuto.addEventListener('click', () => {
      if (settings.autoplayActive) {
        settings.autoplayRemaining = 0;
        settings.autoplayInfinite = false;
        return;
      }
      const value = Number(this.ui.selectAuto.value);
      settings.autoplayInfinite = value < 0;
      settings.autoplayRemaining = value < 0 ? 0 : value;
    });

    this.ui.btnRestart.addEventListener('click', () => {
      flow.restartRequested = true;
    });

    this.ui.btnPaytable.addEventListener('click', () => setModalOpen(this.ui.modalPaytable, true));
    this.ui.btnPaytableClose.addEventListener('click', () =>
      setModalOpen(this.ui.modalPaytable, false),
    );
    this.ui.modalPaytable.addEventListener('click', (event) => {
      if (event.target === this.ui.modalPaytable) setModalOpen(this.ui.modalPaytable, false);
    });
  }

  update(dt: number): void {
    const flow = this.world.singleton(GameFlow);
    const wallet = this.world.singleton(Wallet);
    const settings = this.world.singleton(Settings);
    const session = this.world.singleton(Session);

    this.rollUpWin(wallet, dt);

    this.ui.meterPlayer.textContent = session.playerName || '—';
    this.ui.meterBalance.textContent = String(Math.round(wallet.balance));
    this.ui.meterBet.textContent = String(wallet.bet);
    this.ui.meterWin.textContent = String(Math.floor(wallet.displayedWin));
    this.ui.meterWinBox.classList.toggle('is-hot', wallet.displayedWin > 0);

    const idle = flow.phase === FlowPhase.Idle;
    const broke = wallet.balance < wallet.bet;

    const outOfCredits = session.started && idle && broke;
    setModalOpen(this.ui.modalBroke, outOfCredits);
    if (outOfCredits) {
      this.ui.brokeBet.textContent = String(wallet.bet);
      this.ui.brokeSpins.textContent = String(session.spinsPlayed);
    }

    this.ui.btnSpinLabel.textContent = settings.autoplayActive ? 'STOP' : idle ? 'SPIN' : 'SKIP';
    this.ui.btnSpin.disabled = !session.started || (idle && broke && !settings.autoplayActive);

    this.ui.btnTurbo.setAttribute('aria-pressed', String(settings.turbo));
    this.ui.btnAuto.setAttribute('aria-pressed', String(settings.autoplayActive));
    this.ui.btnAuto.textContent = settings.autoplayInfinite
      ? 'Auto ∞'
      : settings.autoplayRemaining > 0
        ? `Auto ${settings.autoplayRemaining}`
        : 'Auto';
    this.ui.selectAuto.disabled = settings.autoplayActive;

    this.ui.skipHint.classList.toggle('is-visible', session.started && !idle);

    if (idle && wallet.balance !== this.lastSavedBalance && session.started) {
      this.lastSavedBalance = wallet.balance;
      saveSession({ playerName: session.playerName, balance: wallet.balance });
    }
  }

  private rollUpWin(wallet: Wallet, dt: number): void {
    const flow = this.world.singleton(GameFlow);
    if (flow.phase === FlowPhase.Idle || flow.phase === FlowPhase.Settle) {
      wallet.displayedWin = wallet.lastWin;
      return;
    }
    if (wallet.displayedWin >= wallet.lastWin) {
      wallet.displayedWin = wallet.lastWin;
      return;
    }
    wallet.displayedWin = Math.min(wallet.lastWin, wallet.displayedWin + wallet.lastWin * dt * 1.8);
  }
}
