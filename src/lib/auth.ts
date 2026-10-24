/**
 * Auth module — real authentication using localStorage.
 * In production this would connect to a real backend.
 * For now, it provides persistent sessions with email/password hashing.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  credits: number;
}

const AUTH_KEY = 'rsb-auth';
const USERS_KEY = 'rsb-users';

// Simple hash for demo (in production, use bcrypt on server)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
}

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  credits: number;
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    createdAt: stored.createdAt,
    credits: stored.credits,
  };
}

export function signup(email: string, password: string, name: string): { success: boolean; user?: User; error?: string } {
  if (!email || !password || !name) {
    return { success: false, error: 'All fields are required' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  if (!email.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  const users = getStoredUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email already registered' };
  }

  const newUser: StoredUser = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    email: email.toLowerCase(),
    name,
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
    credits: 50, // Free tier
  };

  users.push(newUser);
  saveStoredUsers(users);

  // Auto-login
  const session = { userId: newUser.id, token: simpleHash(newUser.id + Date.now()) };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));

  return { success: true, user: toUser(newUser) };
}

export function login(email: string, password: string): { success: boolean; user?: User; error?: string } {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Create session
  const session = { userId: user.id, token: simpleHash(user.id + Date.now()) };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));

  return { success: true, user: toUser(user) };
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    
    const session = JSON.parse(raw);
    const users = getStoredUsers();
    const user = users.find(u => u.id === session.userId);
    
    if (!user) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }

    return toUser(user);
  } catch {
    return null;
  }
}

export function updateCredits(userId: string, delta: number): void {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.credits = Math.max(0, user.credits + delta);
    saveStoredUsers(users);
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}
