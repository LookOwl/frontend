"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchBookById } from "@/lib/api/books";
import {
  fetchUserLoans,
  LoanError,
  type Loan,
  type LoanStatus,
} from "@/lib/api/loans";
import { getSession } from "@/lib/auth/session";

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

// Préstamos vigentes (el libro sigue en poder del lector o en proceso) vs.
// préstamos cerrados (historial).
const ACTIVE_STATUSES: LoanStatus[] = ["PENDIENTE", "ACTIVO", "VENCIDO"];

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

function LoanCard({ loan, title }: { loan: Loan; title: string | null }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/books/${loan.bookId}`}
          className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
        >
          {title ?? `Libro #${loan.bookId}`}
        </Link>
        <StatusBadge status={loan.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 sm:grid-cols-3">
        <div>
          <dt className="uppercase tracking-wide">Aprobado</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">
            {formatDate(loan.approvalDate)}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Vence</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">
            {formatDate(loan.dueDate)}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Devuelto</dt>
          <dd className="text-zinc-800 dark:text-zinc-200">
            {formatDate(loan.returnDate)}
          </dd>
        </div>
      </dl>
    </li>
  );
}

export default function MyLoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [titles, setTitles] = useState<Map<number, string | null>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchUserLoans(session.accessToken)
      .then(async (result) => {
        if (cancelled) return;
        setLoans(result);

        // Enriquecemos con el título de cada libro (el endpoint solo da el id).
        const uniqueIds = [...new Set(result.map((loan) => loan.bookId))];
        const entries = await Promise.all(
          uniqueIds.map(
            async (id) =>
              [id, (await fetchBookById(id))?.title ?? null] as const,
          ),
        );
        if (!cancelled) setTitles(new Map(entries));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof LoanError
            ? err.message
            : "No se pudieron cargar tus préstamos.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const active = loans?.filter((loan) => ACTIVE_STATUSES.includes(loan.status));
  const history = loans?.filter(
    (loan) => !ACTIVE_STATUSES.includes(loan.status),
  );

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Mis préstamos
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Consulta el estado de tus libros: los que tienes en curso y tu
            historial.
          </p>
        </header>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cargando tus préstamos…
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
            Todavía no tienes préstamos.
          </p>
        ) : null}

        {active && active.length > 0 ? (
          <section className="mb-10 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Activos
            </h2>
            <ul className="flex flex-col gap-3">
              {active.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  title={titles.get(loan.bookId) ?? null}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {history && history.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Historial
            </h2>
            <ul className="flex flex-col gap-3">
              {history.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  title={titles.get(loan.bookId) ?? null}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
