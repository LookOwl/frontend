"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignCopyToRequest,
  fetchLoanRequests,
  RequestError,
  type LoanRequest,
  type LoanRequestStatus,
} from "@/lib/api/requests";
import { getCurrentUser, getSession } from "@/lib/auth/session";

type RequestQueueProps = {
  bookId: number;
};

const STATUS_STYLES: Record<LoanRequestStatus, string> = {
  PENDIENTE:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300",
  ASIGNADA:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-300",
  NOTIFICADA:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300",
  CANCELADA:
    "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
};

function StatusBadge({ status }: { status: LoanRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function AssignForm({
  reqId,
  accessToken,
  onAssigned,
}: {
  reqId: number;
  accessToken: string;
  onAssigned: () => void;
}) {
  const [copyCode, setCopyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const code = copyCode.trim();
    if (!code) {
      setError("Ingresa el código de la copia.");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignCopyToRequest({ reqId, copyCode: code }, accessToken);
      onAssigned();
    } catch (err) {
      setError(
        err instanceof RequestError
          ? err.message
          : "No se pudo asignar la copia.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={copyCode}
          onChange={(event) => setCopyCode(event.target.value)}
          disabled={isSubmitting}
          placeholder="Código de copia"
          aria-label={`Código de copia para la solicitud ${reqId}`}
          className="w-40 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Asignando…" : "Asignar"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function RequestQueue({ bookId }: RequestQueueProps) {
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [requests, setRequests] = useState<LoanRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (token: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchLoanRequests(bookId, token);
        setRequests(result);
      } catch (err) {
        setError(
          err instanceof RequestError
            ? err.message
            : "No se pudieron cargar las solicitudes.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [bookId],
  );

  useEffect(() => {
    const librarian = getCurrentUser()?.role === "bibliotecario";
    setIsLibrarian(librarian);
    if (!librarian) return;

    const session = getSession();
    if (!session) {
      setIsLibrarian(false);
      return;
    }
    setAccessToken(session.accessToken);
    void load(session.accessToken);
  }, [load]);

  // Solo bibliotecarios ven esta sección.
  if (isLibrarian !== true) return null;

  return (
    <section className="mt-14 flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Solicitudes de préstamo
      </h2>

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cargando solicitudes…
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

      {requests && requests.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No hay solicitudes de préstamo para este libro.
        </p>
      ) : null}

      {requests && requests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Solicitud</th>
                <th className="py-2 pr-4 font-medium">Lector</th>
                <th className="py-2 pr-4 font-medium">Días</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Copia</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.reqId}
                  className="border-b border-zinc-100 align-top dark:border-zinc-900"
                >
                  <td className="py-2 pr-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    #{request.reqId}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                    #{request.userId}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                    {request.loanTime}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="py-2 pr-4">
                    {request.bookCopyId !== null ? (
                      <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        #{request.bookCopyId}
                      </span>
                    ) : request.status === "PENDIENTE" && accessToken ? (
                      <AssignForm
                        reqId={request.reqId}
                        accessToken={accessToken}
                        onAssigned={() => {
                          if (accessToken) void load(accessToken);
                        }}
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
