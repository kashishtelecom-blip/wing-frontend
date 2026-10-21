import { safeStorage } from './safe-storage';

export interface AuthUser {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  safeStorage.setItem('wing_token', token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return safeStorage.getItem('wing_token');
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  safeStorage.removeItem('wing_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUserFromToken(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}