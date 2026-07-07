import type { AuthSession, JwtPayload, UserRole } from "@/types/auth";

const STORAGE_KEY = "lookowl.auth.session";
// Evento propio para notificar cambios de sesión dentro de la MISMA pestaña.
// El evento nativo `storage` solo llega a otras pestañas, no a la que escribe.
const SESSION_EVENT = "lookowl:session-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function notifySessionChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function saveSession(session: AuthSession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notifySessionChange();
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
  notifySessionChange();
}

// Suscribe un listener a los cambios de sesión: tanto los de esta pestaña
// (evento propio) como los de otras pestañas (evento nativo `storage`).
// Devuelve la función de limpieza para usar directo en un useEffect.
export function onSessionChange(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
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
