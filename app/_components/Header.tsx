import Link from "next/link";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          LookOwl
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/books"
            className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Catálogo
          </Link>
          <Link
            href="/discover"
            className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Descubrir
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
