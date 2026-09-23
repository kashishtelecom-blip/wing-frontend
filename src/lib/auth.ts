export interface AuthUser {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wing_token', token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wing_token');
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wing_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

/** Decode the JWT payload (base64 middle segment) — no signature check */
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