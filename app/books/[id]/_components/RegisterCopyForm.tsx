"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BookError,
  registerBookCopy,
  type BookCopyStatus,
} from "@/lib/api/books";
import { getCurrentUser, getSession } from "@/lib/auth/session";

type RegisterCopyFormProps = {
  bookId: number;
};

const STATUS_OPTIONS: { value: BookCopyStatus; label: string }[] = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "PRESTADO", label: "Prestado" },
  { value: "DANADO", label: "Dañado" },
];

export function RegisterCopyForm({ bookId }: RegisterCopyFormProps) {
  const router = useRouter();
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copyId, setCopyId] = useState("");
  const [status, setStatus] = useState<BookCopyStatus>("DISPONIBLE");
  const [error, setError] = useState<string | null>(null);
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

    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const code = copyId.trim();
    if (!code) {
      setError("Ingresa el código de la copia.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerBookCopy(bookId, { copyId: code, status }, session.accessToken);
      setCopyId("");
      setStatus("DISPONIBLE");
      setIsOpen(false);
      // Refresca la sección de disponibilidad (renderizada en el servidor).
      router.refresh();
    } catch (err) {
      if (err instanceof BookError) {
        if (err.code === "unauthorized") setIsLibrarian(false);
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Solo bibliotecarios.
  if (isLibrarian !== true) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 inline-flex w-fit items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Registrar copia
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={copyId}
          onChange={(event) => setCopyId(event.target.value)}
          disabled={isSubmitting}
          placeholder="Código de la copia"
          aria-label="Código de la copia"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as BookCopyStatus)}
          disabled={isSubmitting}
          aria-label="Estado de la copia"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Registrando…" : "Guardar copia"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
