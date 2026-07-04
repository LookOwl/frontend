"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

const ACTIONS = [
  {
    href: "/loans/start",
    title: "Registrar préstamo",
    description:
      "Entrega un ejemplar ya asignado y registra el préstamo al lector.",
  },
  {
    href: "/loans/return",
    title: "Registrar devolución",
    description: "Cierra un préstamo y devuelve la copia al inventario.",
  },
] as const;

export default function LoansHubPage() {
  const [isLibrarian, setIsLibrarian] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setIsLibrarian(getCurrentUser()?.role === "bibliotecario");
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Préstamos
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Gestiona la entrega y devolución de ejemplares.
          </p>
        </header>

        {isLibrarian === false ? (
          <p
            role="alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300"
          >
            Solo los bibliotecarios pueden gestionar préstamos.
          </p>
        ) : null}

        {isLibrarian ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <span className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                    {action.title}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {action.description}
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              Para ver el historial de préstamos de un título concreto, abre su
              ficha desde el{" "}
              <Link
                href="/books"
                className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                catálogo
              </Link>
              .
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
