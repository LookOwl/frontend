import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Book } from "@/types/book";
import {
  fetchBookById,
  fetchBookCopies,
  fetchRecommendations,
} from "@/lib/api/books";
import { mockBooks } from "@/lib/mock-books";
import { BadgeList } from "../_components/BadgeList";
import { BookCover } from "../_components/BookCover";
import { BorrowButton } from "../_components/BorrowButton";
import { BookList } from "../_components/BookList";
import { BookAvailability } from "./_components/BookAvailability";
import { BookLoans } from "./_components/BookLoans";
import { EditBookLink } from "./_components/EditBookLink";
import { RequestQueue } from "./_components/RequestQueue";

type PageProps = {
  params: Promise<{ id: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatPublicationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

// Obtenemos el libro por su endpoint dedicado GET /api/books/{id}. Si la API
// no responde (p. ej. en desarrollo sin backend), caemos a los datos mock.
async function getBookById(id: number): Promise<Book | null> {
  const book = await fetchBookById(id);
  if (book) return book;
  return mockBooks.find((mock) => mock.id === id) ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(Number(id));
  return {
    title: book ? `${book.title} · Catálogo` : "Libro no encontrado",
    description: book?.description,
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { id } = await params;
  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId < 1) {
    notFound();
  }

  const book = await getBookById(bookId);
  if (!book) {
    notFound();
  }

  // Endpoints reales del backend, tolerantes a fallo (best-effort).
  const [copies, recommendations] = await Promise.all([
    fetchBookCopies(bookId),
    fetchRecommendations(bookId),
  ]);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/books"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,240px)_1fr]">
          <div className="w-full max-w-[240px]">
            <BookCover src={book.coverUrl} alt={`Portada de ${book.title}`} />
          </div>

          <div className="flex flex-col gap-5">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {book.title}
              </h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400">
                {book.authors.join(", ")}
              </p>
              <BadgeList items={book.categories} max={6} />
            </header>

            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {book.description}
            </p>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Editorial
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {book.editorial}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Publicación
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {formatPublicationDate(book.publicationDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Páginas
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {book.pageCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Idioma
                </dt>
                <dd className="mt-0.5 uppercase text-zinc-900 dark:text-zinc-100">
                  {book.language}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  ISBN
                </dt>
                <dd className="mt-0.5 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {book.isbn}
                </dd>
              </div>
            </dl>

            <section className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Disponibilidad
              </h2>
              <BookAvailability copies={copies} />
            </section>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="max-w-xs">
                <BorrowButton bookId={book.id} />
              </div>
              <EditBookLink bookId={book.id} />
            </div>
          </div>
        </div>

        {recommendations && recommendations.length > 0 ? (
          <section className="mt-14 flex flex-col gap-6">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              También te puede interesar
            </h2>
            <BookList books={recommendations} />
          </section>
        ) : null}

        <RequestQueue bookId={book.id} />
        <BookLoans bookId={book.id} />
      </div>
    </div>
  );
}
