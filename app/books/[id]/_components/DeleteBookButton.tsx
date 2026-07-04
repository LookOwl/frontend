"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookError, deleteBook } from "@/lib/api/books";
import { getCurrentUser, getSession } from "@/lib/auth/session";

type DeleteBookButtonProps = {
  bookId: number;
};

export function DeleteBookButton({ bookId }: DeleteBookButtonProps) {
  const router = useRouter();
  const [isLibrarian, setIsLibrarian] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const sync = () => setIsLibrarian(getCurrentUser()?.role === "bibliotecario");
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  if (!isLibrarian) return null;

  async function handleDelete() {
    setError(null);
    const session = getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBook(bookId, session.accessToken);
      // El libro ya no existe: volvemos al catálogo.
      router.push("/books");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof BookError ? err.message : "No se pudo eliminar el libro.",
      );
      setIsDeleting(false);
    }
  }

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="inline-flex items-center justify-center rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
      >
        Eliminar libro
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        ¿Seguro que quieres eliminar este libro? Esta acción no se puede deshacer.
      </p>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsConfirming(false);
            setError(null);
          }}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
