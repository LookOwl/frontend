"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

type EditBookLinkProps = {
  bookId: number;
};

export function EditBookLink({ bookId }: EditBookLinkProps) {
  const [isLibrarian, setIsLibrarian] = useState(false);

  useEffect(() => {
    const sync = () => {
      const user = getCurrentUser();
      setIsLibrarian(user?.role === "bibliotecario");
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  if (!isLibrarian) return null;

  return (
    <Link
      href={`/books/${bookId}/edit`}
      className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
    >
      Editar libro
    </Link>
  );
}
