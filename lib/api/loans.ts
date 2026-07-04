import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

export type LoanErrorCode =
  | "unauthorized"
  | "not_found"
  | "server"
  | "network"
  | "unknown";

export class LoanError extends Error {
  constructor(
    public readonly code: LoanErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LoanError";
  }
}

export type ReturnBookInput = {
  // Código de la copia física que se está devolviendo.
  copyCode: string;
};

/**
 * Registra la devolución de una copia física (rol BIBLIOTECARIO).
 * Cierra el préstamo asociado y actualiza el inventario en el backend.
 */
export async function returnBook(
  input: ReturnBookInput,
  accessToken: string,
): Promise<void> {
  const url = new URL(API_ENDPOINTS.loans.return, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        book_physical_copy_code: input.copyCode,
      }),
      cache: "no-store",
    });
  } catch {
    throw new LoanError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  // El backend responde 401 tanto para sesión inválida como para roles
  // distintos de BIBLIOTECARIO.
  if (response.status === 401) {
    throw new LoanError(
      "unauthorized",
      "Tu sesión expiró o no tienes permisos de bibliotecario. Inicia sesión de nuevo.",
    );
  }

  // El backend responde 422 cuando no encuentra un préstamo activo para esa
  // copia (o ante un error irrecuperable al procesar la devolución).
  if (response.status === 422) {
    throw new LoanError(
      "not_found",
      "No hay un préstamo activo para esa copia, o el código no es válido.",
    );
  }

  if (response.status >= 500) {
    throw new LoanError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new LoanError("unknown", "Ocurrió un error inesperado.");
  }
}
