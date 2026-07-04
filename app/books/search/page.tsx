"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Book } from "@/types/book";
import {
  advancedSearchBooks,
  type AdvancedSearchInput,
  type SortBy,
} from "@/lib/api/books";
import { BookList } from "../_components/BookList";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50 dark:focus:ring-zinc-50";

const labelClass =
  "text-sm font-medium text-zinc-700 dark:text-zinc-300";

// Divide un texto separado por comas en una lista sin entradas vacías.
function toList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdvancedSearchPage() {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [categories, setCategories] = useState("");
  const [isbn, setIsbn] = useState("");
  const [language, setLanguage] = useState("");
  const [editorial, setEditorial] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("id");
  const [ascending, setAscending] = useState(true);

  const [results, setResults] = useState<Book[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    const input: AdvancedSearchInput = {
      title,
      authors: toList(authors),
      categories: toList(categories),
      isbn,
      language,
      editorial,
      sortBy,
      ascending,
    };

    setIsLoading(true);
    setHasSearched(true);
    try {
      const books = await advancedSearchBooks(input);
      setResults(books);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-2">
          <Link
            href="/books"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Volver al catálogo
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Búsqueda avanzada
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Combina filtros para encontrar resultados más precisos.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-title" className={labelClass}>
              Título
            </label>
            <input
              id="f-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-isbn" className={labelClass}>
              ISBN
            </label>
            <input
              id="f-isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-authors" className={labelClass}>
              Autores <span className="text-zinc-400">(separados por comas)</span>
            </label>
            <input
              id="f-authors"
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Autor 1, Autor 2"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-categories" className={labelClass}>
              Categorías{" "}
              <span className="text-zinc-400">(separadas por comas)</span>
            </label>
            <input
              id="f-categories"
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="Ficción, Historia"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-language" className={labelClass}>
              Idioma
            </label>
            <input
              id="f-language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="es"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-editorial" className={labelClass}>
              Editorial
            </label>
            <input
              id="f-editorial"
              type="text"
              value={editorial}
              onChange={(e) => setEditorial(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-sort" className={labelClass}>
              Ordenar por
            </label>
            <select
              id="f-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className={inputClass}
            >
              <option value="id">Relevancia</option>
              <option value="title">Título</option>
              <option value="date">Fecha de publicación</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-order" className={labelClass}>
              Orden
            </label>
            <select
              id="f-order"
              value={ascending ? "asc" : "desc"}
              onChange={(e) => setAscending(e.target.value === "asc")}
              className={inputClass}
            >
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </form>

        {isLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Buscando libros…
          </p>
        ) : null}

        {!isLoading && hasSearched && (!results || results.length === 0) ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No se encontraron libros con esos filtros. Prueba con otros
            criterios.
          </p>
        ) : null}

        {!isLoading && results && results.length > 0 ? (
          <BookList books={results} />
        ) : null}
      </div>
    </div>
  );
}
