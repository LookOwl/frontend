import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

export type ChatErrorCode = "unauthorized" | "server" | "network" | "unknown";

export class ChatError extends Error {
  constructor(
    public readonly code: ChatErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ChatError";
  }
}

/**
 * Envía un mensaje al asistente virtual y devuelve su respuesta.
 * Requiere sesión autenticada.
 */
export async function sendChatMessage(
  userInput: string,
  accessToken: string,
): Promise<string> {
  const url = new URL(API_ENDPOINTS.chat.send, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ user_input: userInput }),
      cache: "no-store",
    });
  } catch {
    throw new ChatError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new ChatError(
      "unauthorized",
      "Tu sesión expiró o no es válida. Inicia sesión de nuevo.",
    );
  }

  if (response.status >= 500) {
    throw new ChatError(
      "server",
      "El asistente no está disponible en este momento. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new ChatError("unknown", "Ocurrió un error inesperado.");
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}
