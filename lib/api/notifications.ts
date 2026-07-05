import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

export type NotificationType =
  | "INTEREST_TIME_EXPIRED"
  | "PICKUP_TIME_EXPIRED"
  | "REQ_ASSIGNED";

export type Notification = {
  id: number;
  loanReqId: number;
  type: NotificationType;
};

export type NotificationErrorCode =
  | "unauthorized"
  | "server"
  | "network"
  | "unknown";

export class NotificationError extends Error {
  constructor(
    public readonly code: NotificationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "NotificationError";
  }
}

type BackendNotification = {
  id: number;
  loan_req_id: number;
  notification_type: NotificationType;
};

function mapNotification(raw: BackendNotification): Notification {
  return {
    id: raw.id,
    loanReqId: raw.loan_req_id,
    type: raw.notification_type,
  };
}

/**
 * Obtiene las notificaciones del usuario autenticado.
 */
export async function fetchNotifications(
  accessToken: string,
): Promise<Notification[]> {
  const url = new URL(API_ENDPOINTS.users.notifications, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    throw new NotificationError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new NotificationError(
      "unauthorized",
      "Tu sesión expiró o no es válida. Inicia sesión de nuevo.",
    );
  }

  if (response.status >= 500) {
    throw new NotificationError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new NotificationError("unknown", "Ocurrió un error inesperado.");
  }

  const data = (await response.json()) as BackendNotification[];
  return data.map(mapNotification);
}

/**
 * Descarta una notificación del usuario autenticado.
 */
export async function deleteNotification(
  id: number,
  accessToken: string,
): Promise<void> {
  const url = new URL(API_ENDPOINTS.users.notificationById(id), API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    throw new NotificationError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new NotificationError(
      "unauthorized",
      "Tu sesión expiró o no es válida. Inicia sesión de nuevo.",
    );
  }

  if (response.status >= 500) {
    throw new NotificationError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new NotificationError("unknown", "Ocurrió un error inesperado.");
  }
}
