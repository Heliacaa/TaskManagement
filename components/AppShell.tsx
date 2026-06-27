import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, CheckCircle2, Crown, LayoutDashboard, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { HotjarTracker } from "@/components/HotjarTracker";
import { isPremium } from "@/lib/subscription";
import type { getCurrentUser } from "@/lib/auth";

type AppShellProps = {
  children: ReactNode;
  user: Awaited<ReturnType<typeof getCurrentUser>>;
};

export function AppShell({ children, user }: AppShellProps) {
  const premium = isPremium(user?.subscription);

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950 transition dark:bg-zinc-950 dark:text-zinc-50">
      <HotjarTracker
        user={
          user
            ? {
                id: user.id,
                plan: premium ? "premium" : "free",
                isAdmin: user.isAdmin
              }
            : null
        }
      />
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-stone-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-600 text-white">
              <CheckCircle2 size={19} aria-hidden="true" />
            </span>
            <span className="text-lg">TaskFlow</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link className="nav-link" href="/dashboard">
                  <LayoutDashboard size={16} aria-hidden="true" />
                  Dashboard
                </Link>
                <Link className="nav-link" href="/pricing">
                  <Crown size={16} aria-hidden="true" />
                  Pricing
                </Link>
                {user.isAdmin ? (
                  <Link className="nav-link" href="/admin/analytics">
                    <BarChart3 size={16} aria-hidden="true" />
                    Analytics
                  </Link>
                ) : null}
              </>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 sm:inline-flex">
                  {premium ? "Premium" : "Free"}
                </span>
                <form action={logoutAction}>
                  <button className="icon-button" type="submit" title="Log out">
                    <LogOut size={17} aria-hidden="true" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="secondary-button" href="/login">
                  Log in
                </Link>
                <Link className="primary-button" href="/register">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {user ? (
        <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
            <Link className="mobile-nav-link" href="/dashboard">
              Dashboard
            </Link>
            <Link className="mobile-nav-link" href="/pricing">
              Pricing
            </Link>
            {user.isAdmin ? (
              <Link className="mobile-nav-link" href="/admin/analytics">
                Analytics
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
