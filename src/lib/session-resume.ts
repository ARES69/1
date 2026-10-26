/**
 * Session resume — save and restore workspace state.
 */

import type { ThreadMessage } from './types';

export interface SessionState {
  projectId: string;
  messages: ThreadMessage[];
  files: Record<string, string>;
  timestamp: number;
  prompt?: string;
}

const SESSION_KEY = 'rsb-current-session';

export function saveSession(state: SessionState): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load session:', e);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function hasSavedSession(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null;
}

export function getSessionAge(): number | null {
  const session = loadSession();
  if (!session) return null;
  return Date.now() - session.timestamp;
}

export function formatSessionAge(age: number): string {
  const minutes = Math.floor(age / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}
