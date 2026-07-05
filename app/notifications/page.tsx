"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteNotification,
  fetchNotifications,
  NotificationError,
  type Notification,
  type NotificationType,
} from "@/lib/api/notifications";
import { getSession } from "@/lib/auth/session";

const MESSAGES: Record<NotificationType, string> = {
  REQ_ASSIGNED: "Se asignó un ejemplar a tu solicitud de préstamo.",
  INTEREST_TIME_EXPIRED:
    "Expiró el tiempo de interés de tu solicitud de préstamo.",
  PICKUP_TIME_EXPIRED:
    "Expiró el plazo para retirar el ejemplar de tu préstamo.",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetchNotifications(session.accessToken)
      .then((result) => {
        if (!cancelled) setNotifications(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof NotificationError
            ? err.message
            : "No se pudieron cargar las notificaciones.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleDismiss(id: number) {
    setError(null);
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setDismissingId(id);
    try {
      await deleteNotification(id, session.accessToken);
      setNotifications((prev) =>
        prev ? prev.filter((notification) => notification.id !== id) : prev,
      );
    } catch (err) {
      setError(
        err instanceof NotificationError
          ? err.message
          : "No se pudo descartar la notificación.",
      );
    } finally {
      setDismissingId(null);
    }
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Notificaciones
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Avisos sobre tus solicitudes y préstamos.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cargando notificaciones…
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}

        {notifications && notifications.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No tienes notificaciones.
          </p>
        ) : null}

        {notifications && notifications.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-zinc-800 dark:text-zinc-100">
                    {MESSAGES[notification.type]}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Solicitud #{notification.loanReqId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismiss(notification.id)}
                  disabled={dismissingId === notification.id}
                  className="shrink-0 text-xs font-medium text-zinc-600 transition hover:text-zinc-900 disabled:opacity-60 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {dismissingId === notification.id ? "Descartando…" : "Descartar"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
