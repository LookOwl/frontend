import type { Book } from "@/types/book";
import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

type BackendBook = {
  id: number;
  title: string;
  isbn: string;
  description: string;
  editorial: string;
  publication_date: string;
  cover_url: string;
  language: string;
  author: string[];
  category: string[];
  page_count: number;
};

type BooksResponse = {
  data: BackendBook[];
  page: {
    next_cursor: { offset: number };
    has_next: boolean;
  };
};

export type FetchBooksParams = {
  title?: string;
  author?: string;
  limit?: number;
  offset?: number;
};

function mapBook(raw: BackendBook): Book {
  return {
    id: raw.id,
    title: raw.title,
    isbn: raw.isbn,
    description: raw.description,
    editorial: raw.editorial,
    publicationDate: raw.publication_date,
    coverUrl: raw.cover_url,
    language: raw.language,
    authors: raw.author ?? [],
    categories: raw.category ?? [],
    pageCount: raw.page_count,
  };
}

export async function fetchBooks(
  params: FetchBooksParams = {},
): Promise<Book[] | null> {
  const url = new URL(API_ENDPOINTS.books.list, API_BASE_URL);
  if (params.title) url.searchParams.set("title", params.title);
  if (params.author) url.searchParams.set("author", params.author);
  if (params.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params.offset != null)
    url.searchParams.set("offset", String(params.offset));

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as BooksResponse;
    if (!json?.data?.length) return null;
    return json.data.map(mapBook);
  } catch {
    return null;
  }
}
