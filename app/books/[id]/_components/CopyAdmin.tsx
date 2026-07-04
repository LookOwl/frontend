"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookError, deleteBookCopy, type BookCopy } from "@/lib/api/books";
import { getCurrentUser, getSession } from "@/lib/auth/session";
import { RegisterCopyForm } from "./RegisterCopyForm";

type CopyAdminProps = {
  bookId: number;
  copies: BookCopy[] | null;
};

export function CopyAdmin({ bookId, copies }: CopyAdminProps) {
  const router = useRouter();
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
              <button
                type="button"
                onClick={() => handleDelete(copy.copyId)}
                disabled={deletingId === copy.copyId}
                className="text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300"
              >
                {deletingId === copy.copyId ? "Eliminando…" : "Eliminar"}
              </button>
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
