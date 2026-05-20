import type { Metadata } from "next";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta para reservar y gestionar tus lecturas.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-6 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Iniciar sesión
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ingresa tu correo y contraseña para acceder al catálogo.
            </p>
          </header>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
