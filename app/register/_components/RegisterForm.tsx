"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthError, loginUser, registerUser } from "@/lib/api/auth";
import { saveSession } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";

type FormState = {
  fullname: string;
  contactNumber: string;
  email: string;
  password: string;
  role: UserRole;
};

const INITIAL_STATE: FormState = {
  fullname: "",
  contactNumber: "",
  email: "",
  password: "",
  role: "lector",
};

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50 dark:focus:ring-zinc-50";

const labelClassName =
  "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const email = form.email.trim();

    try {
      await registerUser({
        fullname: form.fullname.trim(),
        contactNumber: form.contactNumber.trim(),
        email,
        password: form.password,
        role: form.role,
      });

      // El backend no devuelve token en /register, así que iniciamos sesión
      // automáticamente con /login usando las mismas credenciales.
      try {
        const session = await loginUser({
          email,
          password: form.password,
        });
        saveSession(session);
        router.push("/books");
      } catch {
        // La cuenta se creó, pero el auto-login falló: enviamos a /login.
        router.push("/login?registered=1");
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isPhoneValid = /^[0-9]{9}$/.test(form.contactNumber.trim());

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullname" className={labelClassName}>
          Nombre completo
        </label>
        <input
          id="fullname"
          name="fullname"
          type="text"
          autoComplete="name"
          required
          value={form.fullname}
          onChange={(event) => updateField("fullname", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="Ada Lovelace"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contactNumber" className={labelClassName}>
          Teléfono
        </label>
        <input
          id="contactNumber"
          name="contactNumber"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          pattern="[0-9]{9}"
          maxLength={9}
          value={form.contactNumber}
          onChange={(event) =>
            updateField(
              "contactNumber",
              event.target.value.replace(/\D/g, "").slice(0, 9),
            )
          }
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="987654321"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Exactamente 9 dígitos.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClassName}>
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="tu@correo.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClassName}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={1}
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className={labelClassName}>
          Tipo de cuenta
        </label>
        <select
          id="role"
          name="role"
          required
          value={form.role}
          onChange={(event) =>
            updateField("role", event.target.value as UserRole)
          }
          disabled={isSubmitting}
          className={inputClassName}
        >
          <option value="lector">Lector</option>
          <option value="bibliotecario">Bibliotecario</option>
        </select>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={
          isSubmitting ||
          !form.fullname.trim() ||
          !isPhoneValid ||
          !form.email ||
          !form.password
        }
        className="mt-2 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
