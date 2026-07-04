import type { Metadata } from "next";
import { ReturnBookForm } from "./_components/ReturnBookForm";

export const metadata: Metadata = {
  title: "Registrar devolución",
  description: "Cierra un préstamo y devuelve la copia al inventario.",
};

export default function ReturnBookPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Registrar devolución
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ingresa el código de la copia física para cerrar el préstamo y
              actualizar el inventario.
            </p>
          </header>

          <ReturnBookForm />
        </div>
      </div>
    </div>
  );
}
