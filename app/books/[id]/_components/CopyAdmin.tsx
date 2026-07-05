"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookError,
  deleteBookCopy,
  updateBookCopyStatus,
  type BookCopy,
  type BookCopyStatus,
} from "@/lib/api/books";
import { getCurrentUser, getSession } from "@/lib/auth/session";
import { RegisterCopyForm } from "./RegisterCopyForm";

type CopyAdminProps = {
  bookId: number;
  copies: BookCopy[] | null;
};

const STATUS_OPTIONS: { value: BookCopyStatus; label: string }[] = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "PRESTADO", label: "Prestado" },
  { value: "DANADO", label: "Dañado" },
];

export function CopyAdmin({ bookId, copies }: CopyAdminProps) {
  const router = useRouter();
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setIsLibrarian(getCurrentUser()?.role === "bibliotecario");
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Solo bibliotecarios.
  if (isLibrarian !== true) return null;

  async function handleDelete(copyId: string) {
    setError(null);
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setDeletingId(copyId);
    try {
      await deleteBookCopy(copyId, session.accessToken);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BookError ? err.message : "No se pudo eliminar la copia.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(copyId: string, status: BookCopyStatus) {
    setError(null);
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setUpdatingId(copyId);
    try {
      await updateBookCopyStatus(copyId, status, session.accessToken);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BookError
          ? err.message
          : "No se pudo actualizar el estado de la copia.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Administrar ejemplares
      </h3>

      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {copies && copies.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {copies.map((copy) => (
            <li
              key={copy.copyId}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {copy.copyId}
              </span>
              <div className="flex items-center gap-3">
                <select
                  value={copy.status}
                  onChange={(event) =>
                    handleStatusChange(
                      copy.copyId,
                      event.target.value as BookCopyStatus,
                    )
                  }
                  disabled={updatingId === copy.copyId}
                  aria-label={`Estado de la copia ${copy.copyId}`}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDelete(copy.copyId)}
                  disabled={deletingId === copy.copyId}
                  className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
                >
                  {deletingId === copy.copyId ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sin ejemplares registrados.
        </p>
      )}

      <RegisterCopyForm bookId={bookId} />
    </div>
  );
}
