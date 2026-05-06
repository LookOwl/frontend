import type { Book } from "@/types/book";
import { BookCard } from "./BookCard";

type BookListProps = {
  books: Book[];
};

export function BookList({ books }: BookListProps) {
  if (books.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No hay libros disponibles por el momento.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
