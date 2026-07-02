"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookError, registerBook } from "@/lib/api/books";
import { uploadCover, UploadError } from "@/lib/api/upload";
import { getCurrentUser, getSession } from "@/lib/auth/session";

type FormState = {
  title: string;
  isbn: string;
  description: string;
  editorial: string;
  publicationDate: string;
  coverUrl: string;
  language: string;
  authors: string;
  categories: string;
  pageCount: string;
};

const INITIAL_STATE: FormState = {
  title: "",
  isbn: "",
  description: "",
  editorial: "",
  publicationDate: "",
  coverUrl: "",
  language: "",
  authors: "",
  categories: "",
  pageCount: "",
};

type AuthState = "loading" | "unauthenticated" | "forbidden" | "ok";

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50 dark:focus:ring-zinc-50";

const labelClassName = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function RegisterBookForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const user = getCurrentUser();
      if (!user) {
        setAuthState("unauthenticated");
        return;
      }
      setAuthState(user.role === "bibliotecario" ? "ok" : "forbidden");
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadCover(file);
      updateField("coverUrl", url);
    } catch (err) {
      updateField("coverUrl", "");
      setUploadError(
        err instanceof UploadError
          ? err.message
          : "No se pudo subir la imagen. Intenta de nuevo.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedId(null);

    const session = getSession();
    if (!session) {
      setAuthState("unauthenticated");
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await registerBook(
        {
          title: form.title.trim(),
          isbn: form.isbn.trim(),
          description: form.description.trim(),
          editorial: form.editorial.trim(),
          publicationDate: form.publicationDate,
          coverUrl: form.coverUrl.trim(),
          language: form.language.trim().toLowerCase(),
          authors: splitList(form.authors),
          categories: splitList(form.categories),
          pageCount: Number(form.pageCount),
        },
        session.accessToken,
      );
      setCreatedId(id);
      setForm(INITIAL_STATE);
    } catch (err) {
      if (err instanceof BookError) {
        if (err.code === "unauthorized") {
          setAuthState("unauthenticated");
        }
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authState === "loading") {
    return <div className="h-40" aria-hidden />;
  }

  if (authState === "unauthenticated") {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
          Necesitas iniciar sesión como bibliotecario para registrar libros.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (authState === "forbidden") {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
        Solo los bibliotecarios pueden registrar libros. Tu cuenta no tiene
        permisos para esta acción.
      </p>
    );
  }

  const requiredFilled =
    form.title.trim() &&
    form.isbn.trim() &&
    form.description.trim() &&
    form.editorial.trim() &&
    form.publicationDate &&
    form.coverUrl.trim() &&
    !isUploading &&
    form.language.trim().length === 2 &&
    splitList(form.authors).length > 0 &&
    splitList(form.categories).length > 0 &&
    Number(form.pageCount) >= 1;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClassName}>
          Título
        </label>
        <input
          id="title"
          type="text"
          required
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="El nombre del viento"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="isbn" className={labelClassName}>
            ISBN
          </label>
          <input
            id="isbn"
            type="text"
            required
            value={form.isbn}
            onChange={(event) => updateField("isbn", event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="978-3-16-148410-0"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ISBN-10 o ISBN-13 (se valida el dígito de control).
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="editorial" className={labelClassName}>
            Editorial
          </label>
          <input
            id="editorial"
            type="text"
            required
            value={form.editorial}
            onChange={(event) => updateField("editorial", event.target.value)}
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Plaza & Janés"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className={labelClassName}>
          Descripción
        </label>
        <textarea
          id="description"
          required
          rows={3}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="Sinopsis del libro..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="publicationDate" className={labelClassName}>
            Fecha de publicación
          </label>
          <input
            id="publicationDate"
            type="date"
            required
            value={form.publicationDate}
            onChange={(event) =>
              updateField("publicationDate", event.target.value)
            }
            disabled={isSubmitting}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="language" className={labelClassName}>
            Idioma
          </label>
          <input
            id="language"
            type="text"
            required
            maxLength={2}
            value={form.language}
            onChange={(event) =>
              updateField(
                "language",
                event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2),
              )
            }
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="es"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Código de 2 letras (es, en, fr...).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cover" className={labelClassName}>
          Portada
        </label>
        <input
          id="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCoverChange}
          disabled={isSubmitting || isUploading}
          className={`${inputClassName} file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-zinc-700 dark:file:bg-zinc-800 dark:file:text-zinc-200`}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          JPG, PNG o WebP. Máximo 5 MB.
        </p>
        {isUploading ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Subiendo imagen…
          </p>
        ) : null}
        {uploadError ? (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {uploadError}
          </p>
        ) : null}
        {form.coverUrl && !isUploading ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverUrl}
            alt="Vista previa de la portada"
            className="mt-1 h-40 w-auto rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="authors" className={labelClassName}>
          Autores
        </label>
        <input
          id="authors"
          type="text"
          required
          value={form.authors}
          onChange={(event) => updateField("authors", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="Patrick Rothfuss, Otro Autor"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Separa varios autores con comas.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categories" className={labelClassName}>
          Categorías
        </label>
        <input
          id="categories"
          type="text"
          required
          value={form.categories}
          onChange={(event) => updateField("categories", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="Fantasía, Aventura"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Separa varias categorías con comas.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pageCount" className={labelClassName}>
          Número de páginas
        </label>
        <input
          id="pageCount"
          type="number"
          min={1}
          required
          value={form.pageCount}
          onChange={(event) => updateField("pageCount", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="662"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {createdId !== null ? (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300"
        >
          Libro registrado correctamente (ID {createdId}).{" "}
          <Link href="/books" className="font-medium underline underline-offset-4">
            Ver catálogo
          </Link>
          .
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !requiredFilled}
        className="mt-2 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Registrando..." : "Registrar libro"}
      </button>
    </form>
  );
}
