import type { Book } from "@/types/book";
import { BadgeList } from "./BadgeList";
import { BookCover } from "./BookCover";
import { BorrowButton } from "./BorrowButton";

type BookCardProps = {
  book: Book;
};

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  year: "numeric",
  month: "long",
});

function formatPublicationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

export function BookCard({ book }: BookCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <BookCover src={book.coverUrl} alt={`Portada de ${book.title}`} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {book.title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {book.authors.join(", ")}
          </p>
        </header>

        <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {book.description}
        </p>

        <BadgeList items={book.categories} max={3} />

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              Editorial
            </dt>
            <dd className="truncate">{book.editorial}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              Publicación
            </dt>
            <dd>{formatPublicationDate(book.publicationDate)}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              Páginas
            </dt>
            <dd>{book.pageCount}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-700 dark:text-zinc-300">
              Idioma
            </dt>
            <dd>{book.language}</dd>
          </div>
        </dl>

        <BorrowButton bookId={book.id} />
      </div>
    </article>
  );
}
