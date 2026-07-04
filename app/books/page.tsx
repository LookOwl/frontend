import type { Metadata } from "next";
import Link from "next/link";
import { BooksCatalog } from "./_components/BooksCatalog";
import { fetchBooks } from "@/lib/api/books";
import { mockBooks } from "@/lib/mock-books";

export const metadata: Metadata = {
  title: "Catálogo de libros",
  description: "Explora el catálogo y reserva tu próxima lectura.",
};

export default async function BooksPage() {
  const apiBooks = await fetchBooks({ limit: 100 });
  const books = apiBooks ?? mockBooks;

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Catálogo de libros
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Explora los títulos disponibles en la biblioteca. Pronto podrás
            reservar tu lectura favorita.
          </p>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {books.length} libros disponibles
          </p>
          <Link
            href="/books/search"
            className="w-fit text-sm font-medium text-zinc-700 underline underline-offset-2 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Búsqueda avanzada →
          </Link>
        </header>

        <BooksCatalog books={books} />
      </div>
    </div>
  );
}
