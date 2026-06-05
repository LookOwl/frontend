import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./_components/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate para reservar y gestionar tus lecturas.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Crear cuenta
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Completa tus datos para acceder al catálogo.
            </p>
          </header>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
