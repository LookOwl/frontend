import type { BookCopy } from "@/lib/api/books";

type BookAvailabilityProps = {
  copies: BookCopy[] | null;
};

const STATUS_LABEL: Record<BookCopy["status"], string> = {
  DISPONIBLE: "Disponible",
  PRESTADO: "Prestado",
  DANADO: "Dañado",
};

const STATUS_CLASS: Record<BookCopy["status"], string> = {
  DISPONIBLE:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300",
  PRESTADO:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300",
  DANADO:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300",
};

export function BookAvailability({ copies }: BookAvailabilityProps) {
  if (copies === null) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No se pudo cargar la disponibilidad.
      </p>
    );
  }

  if (copies.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Este libro no tiene ejemplares registrados.
      </p>
    );
  }

  const available = copies.filter((c) => c.status === "DISPONIBLE").length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {available}
        </span>{" "}
        de{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {copies.length}
        </span>{" "}
        {copies.length === 1 ? "ejemplar disponible" : "ejemplares disponibles"}
      </p>
      <ul className="flex flex-col gap-1.5">
        {copies.map((copy) => (
          <li
            key={copy.copyId}
            className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800"
          >
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {copy.copyId}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[copy.status]}`}
            >
              {STATUS_LABEL[copy.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
