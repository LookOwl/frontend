"use client";

import { useState, type FormEvent } from "react";
import type { Book } from "@/types/book";
import { fetchRecommendationsByQuery } from "@/lib/api/books";
import { BookList } from "../books/_components/BookList";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const books = await fetchRecommendationsByQuery(text);
      setResults(books);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Descubrir lecturas
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Describe lo que buscas y te recomendamos libros de la biblioteca.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={isLoading}
            placeholder="Ej. novelas de misterio ambientadas en el mar"
            aria-label="Describe qué quieres leer"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isLoading ? "Buscando…" : "Recomendar"}
          </button>
        </form>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Buscando recomendaciones…
          </p>
        ) : null}

        {!isLoading && hasSearched && (!results || results.length === 0) ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No encontramos recomendaciones para esa consulta. Prueba con otras
            palabras.
          </p>
        ) : null}

        {!isLoading && results && results.length > 0 ? (
          <BookList books={results} />
        ) : null}
      </div>
    </div>
  );
}
