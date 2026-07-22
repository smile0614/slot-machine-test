const KEY = 'ecs-slots/session';

export interface StoredSession {
  playerName: string;
  balance: number;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.playerName !== 'string' || typeof parsed.balance !== 'number') return null;
    return { playerName: parsed.playerName, balance: parsed.balance };
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {

  }
}
