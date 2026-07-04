import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

export type LoanErrorCode =
  | "unauthorized"
  | "not_found"
  | "conflict"
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

export type StartLoanInput = {
  // Código de la copia física que se entrega al lector. La solicitud de
  // préstamo asociada ya debe tener esta copia asignada.
  copyCode: string;
};

export type ReturnBookInput = {
  // Código de la copia física que se está devolviendo.
  copyCode: string;
};

/**
 * Registra la entrega de un préstamo (rol BIBLIOTECARIO).
 * Toma una solicitud de préstamo que ya tiene una copia física asignada y la
 * marca como entregada al lector, dejando el ejemplar bajo control de préstamo.
 */
export async function startLoan(
  input: StartLoanInput,
  accessToken: string,
): Promise<void> {
  const url = new URL(API_ENDPOINTS.loans.start, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        book_physical_copy: input.copyCode,
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

  // 422: no existe una solicitud de préstamo para esa copia física.
  if (response.status === 422) {
    throw new LoanError(
      "not_found",
      "No hay una solicitud de préstamo asociada a esa copia. Verifica el código.",
    );
  }

  // 409: el préstamo ya fue iniciado, o la solicitud aún no tiene una copia
  // física asignada.
  if (response.status === 409) {
    throw new LoanError(
      "conflict",
      "El préstamo ya fue registrado, o la solicitud todavía no tiene una copia asignada.",
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
