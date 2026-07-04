export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  books: {
    search: "/api/books/search",
    register: "/api/books/register",
  },
  requests: {
    create: "/api/request/",
  },
  loans: {
    start: "/api/loans/start",
    return: "/api/loans/return",
    byBook: (bookId: number) => `/api/loans/${bookId}`,
  },
  users: {
    login: "/api/users/login",
    register: "/api/users/register",
  },
} as const;
