import type { AuthSession, JwtPayload, UserRole } from "@/types/auth";

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

// El backend serializa el rol con str(Enum), por lo que el JWT puede llegar
// como "RolUsuario.BIBLIOTECARIO" / "RolUsuario.LECTOR" en lugar de
// "bibliotecario" / "lector". Normalizamos aquí para que el resto del front
// trabaje siempre con los valores limpios de UserRole.
function normalizeRole(rawRole: unknown): UserRole | undefined {
  if (typeof rawRole !== "string") return undefined;
  const value = rawRole.includes(".")
    ? rawRole.slice(rawRole.lastIndexOf(".") + 1)
    : rawRole;
  const normalized = value.trim().toLowerCase();
  if (normalized === "bibliotecario") return "bibliotecario";
  if (normalized === "lector") return "lector";
  return undefined;
}

function decodeJwt(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    const parsed = JSON.parse(json) as JwtPayload;
    const role = normalizeRole(parsed.role);
    return role ? { ...parsed, role } : parsed;
  } catch {
    return null;
  }
}

export function getCurrentUser(): JwtPayload | null {
  const session = getSession();
  if (!session) return null;
  return decodeJwt(session.accessToken);
}
