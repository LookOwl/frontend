import type { Metadata } from "next";
import { StartLoanForm } from "./_components/StartLoanForm";

export const metadata: Metadata = {
  title: "Registrar préstamo",
  description: "Entrega un ejemplar asignado y registra el préstamo al lector.",
};

export default function StartLoanPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Registrar préstamo
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ingresa el código de la copia física para registrar la entrega del
              ejemplar al lector.
            </p>
          </header>

          <StartLoanForm />
        </div>
      </div>
    </div>
  );
}
