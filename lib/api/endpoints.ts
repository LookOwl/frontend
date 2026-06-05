export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  books: {
    list: "/api/books/",
  },
  users: {
    login: "/api/users/login",
    register: "/api/users/register",
  },
} as const;
