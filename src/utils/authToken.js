import { jwtDecode } from 'jwt-decode';

export function getAuthToken() {
  const stored = localStorage.getItem('token');
  if (!stored || stored === 'null' || stored === 'undefined') return null;
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed === 'string') return parsed;
  } catch {
    // plain JWT string
  }
  return stored;
}

/** Fix legacy tokens saved via JSON.stringify — run once on app boot. */
export function normalizeStoredToken() {
  const stored = localStorage.getItem('token');
  if (!stored || stored === 'null' || stored === 'undefined') return;
  const token = getAuthToken();
  if (token && token !== stored) {
    localStorage.setItem('token', token);
  }
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function getAuthUserId() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return jwtDecode(token).id ?? null;
  } catch {
    return null;
  }
}
