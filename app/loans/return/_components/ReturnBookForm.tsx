"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoanError, returnBook } from "@/lib/api/loans";
import { getCurrentUser, getSession } from "@/lib/auth/session";

export function ReturnBookForm() {
  const router = useRouter();
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);
  const [copyCode, setCopyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sync = () => setIsLibrarian(getCurrentUser()?.role === "bibliotecario");
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSuccess(false);

    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const code = copyCode.trim();
    if (!code) {
      setError("Ingresa el código de la copia física.");
      return;
    }

    setIsSubmitting(true);
    try {
      await returnBook({ copyCode: code }, session.accessToken);
      setIsSuccess(true);
      setCopyCode("");
    } catch (err) {
      if (err instanceof LoanError) {
        if (err.code === "unauthorized") {
          setIsLibrarian(false);
        }
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLibrarian === null) {
    return <div className="h-40" aria-hidden />;
  }

  if (!isLibrarian) {
    return (
      <p
        role="alert"
        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300"
      >
        Solo los bibliotecarios pueden registrar devoluciones.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="copy-code"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Código de la copia física
        </label>
        <input
          id="copy-code"
          type="text"
          required
          autoFocus
          value={copyCode}
          onChange={(event) => setCopyCode(event.target.value)}
          disabled={isSubmitting}
          placeholder="Ej. ABC-00123"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {isSuccess ? (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300"
        >
          Devolución registrada. El préstamo fue cerrado y la copia vuelve al
          inventario.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Registrando..." : "Registrar devolución"}
      </button>
    </form>
  );
}
