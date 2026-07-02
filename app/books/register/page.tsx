import type { Metadata } from "next";
import { BookForm } from "../_components/BookForm";

export const metadata: Metadata = {
  title: "Registrar libro",
  description: "Añade un nuevo libro al catálogo de la biblioteca.",
};

export default function RegisterBookPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Registrar libro
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Completa los datos para añadir un nuevo título al catálogo.
            </p>
          </header>

          <BookForm />
        </div>
      </div>
    </div>
  );
}
