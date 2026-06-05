import type { AuthSession, JwtPayload } from "@/types/auth";

const STORAGE_KEY = "lookowl.auth.session";

function isBrowser() {
  return typeof window !== "undefined";
}

export function saveSession(session: AuthSession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function decodeJwt(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getCurrentUser(): JwtPayload | null {
  const session = getSession();
  if (!session) return null;
  return decodeJwt(session.accessToken);
}
