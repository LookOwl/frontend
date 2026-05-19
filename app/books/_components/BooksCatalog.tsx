"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/types/book";
import { BookList } from "./BookList";

type BooksCatalogProps = {
  books: Book[];
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function BooksCatalog({ books }: BooksCatalogProps) {
  const [query, setQuery] = useState("");

  const filteredBooks = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return books;
    return books.filter((book) => {
      if (normalize(book.title).includes(term)) return true;
      return book.authors.some((author) => normalize(author).includes(term));
    });
  }, [books, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="book-search"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Buscar por título o autor
        </label>
        <div className="relative">
          <input
            id="book-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Escribe un título o autor..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {filteredBooks.length} de {books.length} libros
        </p>
      </div>

      <BookList books={filteredBooks} />
    </div>
  );
}
