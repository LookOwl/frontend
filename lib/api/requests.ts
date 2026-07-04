import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

export type LoanRequestStatus =
  | "PENDIENTE"
  | "CANCELADA"
  | "ASIGNADA"
  | "NOTIFICADA";

export type LoanRequest = {
  // Identificador de la solicitud (el backend lo expone como `loan_id`; es el
  // `req_id` que espera el endpoint de asignación).
  reqId: number;
  userId: number;
  bookId: number;
  bookCopyId: number | null;
  loanTime: number;
  status: LoanRequestStatus;
};

export type RequestErrorCode =
  | "unauthorized"
  | "invalid"
  | "unavailable"
  | "server"
  | "network"
  | "unknown";

export class RequestError extends Error {
  constructor(
    public readonly code: RequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

type BackendLoanRequest = {
  loan_id: number;
  user_id: number;
  book_id: number;
  book_copy_id: number | null;
  loan_time: number;
  status: LoanRequestStatus;
};

function mapLoanRequest(raw: BackendLoanRequest): LoanRequest {
  return {
    reqId: raw.loan_id,
    userId: raw.user_id,
    bookId: raw.book_id,
    bookCopyId: raw.book_copy_id,
    loanTime: raw.loan_time,
    status: raw.status,
  };
}

/**
 * Obtiene las solicitudes de préstamo asignables de un libro (rol BIBLIOTECARIO).
 */
export async function fetchLoanRequests(
  bookId: number,
  accessToken: string,
): Promise<LoanRequest[]> {
  const url = new URL(API_ENDPOINTS.requests.byBook(bookId), API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    throw new RequestError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new RequestError(
      "unauthorized",
      "Tu sesión expiró o no tienes permisos de bibliotecario. Inicia sesión de nuevo.",
    );
  }

  if (response.status >= 500) {
    throw new RequestError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new RequestError("unknown", "Ocurrió un error inesperado.");
  }

  const data = (await response.json()) as BackendLoanRequest[];
  return data.map(mapLoanRequest);
}

export type AssignCopyInput = {
  reqId: number;
  copyCode: string;
};

/**
 * Asigna una copia física a una solicitud de préstamo (rol BIBLIOTECARIO).
 */
export async function assignCopyToRequest(
  input: AssignCopyInput,
  accessToken: string,
): Promise<void> {
  const url = new URL(API_ENDPOINTS.requests.assign, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        req_id: input.reqId,
        book_copy_code: input.copyCode,
      }),
      cache: "no-store",
    });
  } catch {
    throw new RequestError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new RequestError(
      "unauthorized",
      "Tu sesión expiró o no tienes permisos de bibliotecario. Inicia sesión de nuevo.",
    );
  }

  // 422: la solicitud no es válida o la copia no existe.
  if (response.status === 422) {
    throw new RequestError(
      "invalid",
      "La solicitud no es válida o la copia no existe. Verifica el código.",
    );
  }

  // 409: la copia existe pero no está disponible.
  if (response.status === 409) {
    throw new RequestError(
      "unavailable",
      "La copia no está disponible para asignar.",
    );
  }

  if (response.status >= 500) {
    throw new RequestError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new RequestError("unknown", "Ocurrió un error inesperado.");
  }
}
