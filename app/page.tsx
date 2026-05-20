import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Tu próxima lectura empieza aquí
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Explora el catálogo de la biblioteca, descubre títulos por autor o
            tema y reserva el que quieras leer.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/books"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Explorar catálogo
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Iniciar sesión
          </Link>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No necesitas cuenta para explorar el catálogo.
        </p>
      </main>
    </div>
  );
}
