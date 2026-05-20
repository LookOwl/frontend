"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getSession } from "@/lib/auth/session";

export function UserMenu() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setIsAuthenticated(getSession() !== null);
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function handleLogout() {
    clearSession();
    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
  }

  if (isAuthenticated === null) {
    return <div className="h-9 w-24" aria-hidden />;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      Cerrar sesión
    </button>
  );
}
