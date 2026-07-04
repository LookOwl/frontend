"use client";

import { useEffect, useState } from "react";
import { fetchBookLoans, LoanError, type Loan, type LoanStatus } from "@/lib/api/loans";
import { getCurrentUser, getSession } from "@/lib/auth/session";

type BookLoansProps = {
  bookId: number;
};

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

const STATUS_STYLES: Record<LoanStatus, string> = {
  ACTIVO:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300",
  VENCIDO:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300",
  PENDIENTE:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300",
  CONCLUIDO:
    "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  CANCELADO:
    "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500",
  PERDIDO:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300",
};

function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function BookLoans({ bookId }: BookLoansProps) {
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const librarian = getCurrentUser()?.role === "bibliotecario";
    setIsLibrarian(librarian);
    if (!librarian) return;

    const session = getSession();
    if (!session) {
      setIsLibrarian(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    fetchBookLoans(bookId, session.accessToken)
      .then((result) => {
        if (!cancelled) setLoans(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof LoanError
            ? err.message
            : "No se pudieron cargar los préstamos.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // Solo bibliotecarios ven esta sección.
  if (isLibrarian !== true) return null;

  return (
    <section className="mt-14 flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Historial de préstamos
      </h2>

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cargando préstamos…
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

      {loans && loans.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Este libro no tiene préstamos registrados.
        </p>
      ) : null}

      {loans && loans.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Copia</th>
                <th className="py-2 pr-4 font-medium">Lector</th>
                <th className="py-2 pr-4 font-medium">Aprobado</th>
                <th className="py-2 pr-4 font-medium">Vence</th>
                <th className="py-2 pr-4 font-medium">Devuelto</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="border-b border-zinc-100 dark:border-zinc-900"
                >
                  <td className="py-2 pr-4">
                    <StatusBadge status={loan.status} />
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    #{loan.bookCopyId}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                    #{loan.userId}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                    {formatDate(loan.approvalDate)}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                    {formatDate(loan.dueDate)}
                  </td>
                  <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                    {formatDate(loan.returnDate)}
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
