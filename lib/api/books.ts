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

export type RegisterBookInput = {
  title: string;
  isbn: string;
  description: string;
  editorial: string;
  publicationDate: string;
  coverUrl: string;
  language: string;
  authors: string[];
  categories: string[];
  pageCount: number;
};

export type BookErrorCode =
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "validation"
  | "server"
  | "network"
  | "unknown";

export class BookError extends Error {
  constructor(
    public readonly code: BookErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BookError";
  }
}

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

export async function registerBook(
  input: RegisterBookInput,
  accessToken: string,
): Promise<number> {
  const url = new URL(API_ENDPOINTS.books.register, API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: input.title,
        isbn: input.isbn,
        description: input.description,
        editorial: input.editorial,
        publication_date: input.publicationDate,
        cover_url: input.coverUrl,
        language: input.language,
        author: input.authors,
        category: input.categories,
        page_count: input.pageCount,
      }),
      cache: "no-store",
    });
  } catch {
    throw new BookError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new BookError(
      "unauthorized",
      "Tu sesión expiró o no es válida. Inicia sesión de nuevo.",
    );
  }

  if (response.status === 403) {
    throw new BookError(
      "forbidden",
      "Solo los bibliotecarios pueden registrar libros.",
    );
  }

  if (response.status === 409) {
    throw new BookError(
      "conflict",
      "No se pudo crear el libro. Puede que el ISBN ya exista.",
    );
  }

  if (response.status === 422) {
    throw new BookError(
      "validation",
      "Revisa los datos: el ISBN debe ser válido, el idioma debe tener 2 letras, la URL de portada debe ser válida y debe haber al menos un autor y una categoría.",
    );
  }

  if (response.status >= 500) {
    throw new BookError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new BookError("unknown", "Ocurrió un error inesperado.");
  }

  const data = (await response.json()) as { id: number };
  return data.id;
}

export type RequestLoanInput = {
  bookId: number;
  daysRequested: number;
  interestWindow?: number;
};

export async function requestLoan(
  input: RequestLoanInput,
  accessToken: string,
): Promise<void> {
  const url = new URL(
    `${API_ENDPOINTS.books.borrow}/${input.bookId}`,
    API_BASE_URL,
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        book_id: input.bookId,
        n_days_requested: input.daysRequested,
        interest_window: input.interestWindow ?? 2,
      }),
      cache: "no-store",
    });
  } catch {
    throw new BookError(
      "network",
      "No se pudo conectar con el servidor. Intenta de nuevo.",
    );
  }

  if (response.status === 401) {
    throw new BookError(
      "unauthorized",
      "Tu sesión expiró o no es válida. Inicia sesión de nuevo.",
    );
  }

  // El backend responde 403 ante cualquier motivo que impida el préstamo
  // (cola llena, demasiadas solicitudes, días fuera de rango, etc.).
  if (response.status === 403) {
    throw new BookError(
      "forbidden",
      "No se pudo solicitar el préstamo. Puede que el libro no esté disponible o que ya tengas demasiadas solicitudes en cola.",
    );
  }

  if (response.status === 422) {
    throw new BookError(
      "validation",
      "Revisa los datos del préstamo: los días solicitados deben ser un número válido (entre 1 y 13).",
    );
  }

  if (response.status >= 500) {
    throw new BookError(
      "server",
      "El servidor no respondió correctamente. Intenta más tarde.",
    );
  }

  if (!response.ok) {
    throw new BookError("unknown", "Ocurrió un error inesperado.");
  }
}
