import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Book } from "@/types/book";
import { fetchBookById } from "@/lib/api/books";
import { mockBooks } from "@/lib/mock-books";
import { BookForm } from "../../_components/BookForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Editar libro",
  description: "Corrige o actualiza los datos de un libro del catálogo.",
};

// Obtenemos el libro por su endpoint dedicado GET /api/books/{id}, con fallback
// a los datos mock si la API no responde (p. ej. en desarrollo sin backend).
async function getBookById(id: number): Promise<Book | null> {
  const book = await fetchBookById(id);
  if (book) return book;
  return mockBooks.find((mock) => mock.id === id) ?? null;
}

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId < 1) {
    notFound();
  }

  const book = await getBookById(bookId);
  if (!book) {
    notFound();
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <Link
          href={`/books/${bookId}`}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Volver al detalle
        </Link>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Editar libro
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Corrige o actualiza los datos de «{book.title}».
            </p>
          </header>

          <BookForm
            mode="edit"
            bookId={bookId}
            initialValues={{
              title: book.title,
              isbn: book.isbn,
              description: book.description,
              editorial: book.editorial,
              publicationDate: book.publicationDate?.slice(0, 10) ?? "",
              coverUrl: book.coverUrl,
              language: book.language,
              authors: book.authors.join(", "),
              categories: book.categories.join(", "),
              pageCount: String(book.pageCount ?? ""),
            }}
          />
        </div>
      </div>
    </div>
  );
}
