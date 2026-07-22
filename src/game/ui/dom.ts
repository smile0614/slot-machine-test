import { PAYLINES } from '../config/paylines';
import { PAYTABLE } from '../config/paytable';
import { SYMBOLS } from '../config/symbols';

export interface UiRefs {
  stage: HTMLElement;
  skipHint: HTMLElement;
  meterPlayer: HTMLElement;
  meterBalance: HTMLElement;
  meterBet: HTMLElement;
  meterWin: HTMLElement;
  meterWinBox: HTMLElement;
  btnSpin: HTMLButtonElement;
  btnSpinLabel: HTMLElement;
  btnTurbo: HTMLButtonElement;
  btnAuto: HTMLButtonElement;
  selectAuto: HTMLSelectElement;
  btnPaytable: HTMLButtonElement;
  btnPaytableClose: HTMLButtonElement;
  modalName: HTMLElement;
  modalPaytable: HTMLElement;
  modalBroke: HTMLElement;
  btnRestart: HTMLButtonElement;
  brokeBet: HTMLElement;
  brokeSpins: HTMLElement;
  formName: HTMLFormElement;
  inputName: HTMLInputElement;
  paytableBody: HTMLElement;
}

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`UI: missing #${id}`);
  return node as T;
}

export function queryUi(): UiRefs {
  return {
    stage: el('stage'),
    skipHint: el('skip-hint'),
    meterPlayer: el('meter-player'),
    meterBalance: el('meter-balance'),
    meterBet: el('meter-bet'),
    meterWin: el('meter-win'),
    meterWinBox: el<HTMLElement>('meter-win').parentElement as HTMLElement,
    btnSpin: el<HTMLButtonElement>('btn-spin'),
    btnSpinLabel: el('btn-spin-label'),
    btnTurbo: el<HTMLButtonElement>('btn-turbo'),
    btnAuto: el<HTMLButtonElement>('btn-auto'),
    selectAuto: el<HTMLSelectElement>('select-auto'),
    btnPaytable: el<HTMLButtonElement>('btn-paytable'),
    btnPaytableClose: el<HTMLButtonElement>('btn-paytable-close'),
    modalName: el('modal-name'),
    modalPaytable: el('modal-paytable'),
    modalBroke: el('modal-broke'),
    btnRestart: el<HTMLButtonElement>('btn-restart'),
    brokeBet: el('broke-bet'),
    brokeSpins: el('broke-spins'),
    formName: el<HTMLFormElement>('form-name'),
    inputName: el<HTMLInputElement>('input-name'),
    paytableBody: el('paytable-body'),
  };
}

export function setModalOpen(modal: HTMLElement, open: boolean): void {
  modal.dataset.open = String(open);
}

const hex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`;

export function renderPaytable(target: HTMLElement, bet: number): void {
  const matches = Object.keys(PAYTABLE)
    .map(Number)
    .sort((a, b) => a - b);

  const rows: string[] = [];

  rows.push('<p class="pt-section">Symbols (multiplier · frequency)</p>');
  for (const s of SYMBOLS) {
    rows.push(
      `<div class="pt-row">
         <span class="pt-chip" style="background:${hex(s.color)}">${s.label}</span>
         <span class="pt-row__name">${s.key}${s.tall ? ' <span class="pt-tall">TALL 2×</span>' : ''}</span>
         <span class="pt-row__value">×${s.multiplier} · w${s.weight}</span>
       </div>`,
    );
  }

  rows.push('<p class="pt-section">Line wins (left to right)</p>');
  for (const count of matches) {
    rows.push(
      `<div class="pt-row">
         <span class="pt-row__name">${count} in a row</span>
         <span class="pt-row__value">×${PAYTABLE[count]} bet — ${bet * PAYTABLE[count]} × symbol</span>
       </div>`,
    );
  }

  rows.push('<p class="pt-section">Paylines</p>');
  for (const line of PAYLINES) {
    rows.push(
      `<div class="pt-row">
         <span class="pt-chip" style="background:${hex(line.color)}">${line.id + 1}</span>
         <span class="pt-row__name">${line.name}</span>
         <span class="pt-row__value">${line.rows.join('-')}</span>
       </div>`,
    );
  }

  target.innerHTML = rows.join('');
}
