import type { AuthSession, LoginCredentials } from "@/types/auth";
import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type AuthErrorCode =
  | "invalid_credentials"
  | "validation"
  | "server"
  | "network"
  | "unknown";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function mapSession(raw: LoginResponse): AuthSession {
  return {
    accessToken: raw.access_token,
    tokenType: raw.token_type,
  };
}

export async function loginUser(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  const url = new URL(API_ENDPOINTS.users.login, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
  } catch {
    throw new AuthError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new AuthError(
      "invalid_credentials",
      "Correo o contraseña incorrectos.",
    );
  }

  if (response.status === 422) {
    throw new AuthError(
      "validation",
      "Revisa que el correo tenga un formato válido y la contraseña no esté vacía.",
    );
  }

  if (response.status >= 500) {
    throw new AuthError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new AuthError("unknown", "Ocurrió un error inesperado.");
  }

  const data = (await response.json()) as LoginResponse;
  return mapSession(data);
}
