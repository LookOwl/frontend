"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookError, requestLoan } from "@/lib/api/books";
import { getSession } from "@/lib/auth/session";

type BorrowButtonProps = {
  bookId: number;
};

const MIN_DAYS = 1;
const MAX_DAYS = 13;

export function BorrowButton({ bookId }: BorrowButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [days, setDays] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sync = () => setIsAuthenticated(getSession() !== null);
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const daysRequested = Number(days);
    if (
      !Number.isInteger(daysRequested) ||
      daysRequested < MIN_DAYS ||
      daysRequested > MAX_DAYS
    ) {
      setError(`Indica un número de días entre ${MIN_DAYS} y ${MAX_DAYS}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await requestLoan({ bookId, daysRequested }, session.accessToken);
      setIsSuccess(true);
      setIsOpen(false);
    } catch (err) {
      if (err instanceof BookError) {
        if (err.code === "unauthorized") {
          setIsAuthenticated(false);
        }
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <p
        role="status"
        className="mt-1 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300"
      >
        Solicitud de préstamo enviada.
      </p>
    );
  }

  if (isAuthenticated === false) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-1 inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Inicia sesión para reservar
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isAuthenticated === null}
        className="mt-1 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Reservar
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-1 flex flex-col gap-2">
      <label
        htmlFor={`days-${bookId}`}
        className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
      >
        Días de préstamo ({MIN_DAYS}–{MAX_DAYS})
      </label>
      <input
        id={`days-${bookId}`}
        type="number"
        min={MIN_DAYS}
        max={MAX_DAYS}
        required
        value={days}
        onChange={(event) => setDays(event.target.value)}
        disabled={isSubmitting}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
      />

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex flex-1 items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Enviando..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
