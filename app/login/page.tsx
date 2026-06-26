import Link from "next/link";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};

  return (
    <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
      <div className="space-y-6 py-4">
        <p className="eyebrow">SaaS task management</p>
        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-bold text-zinc-950 dark:text-white sm:text-5xl">
            TaskFlow
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            A working MVP with projects, tasks, premium limits, and analytics
            reporting built for a recruiter-friendly GitHub demo.
          </p>
        </div>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
          {["MRR dashboard", "Funnel tracking", "Pricing heat signals"].map(
            (item) => (
              <div key={item} className="panel px-4 py-3 text-sm font-semibold">
                {item}
              </div>
            )
          )}
        </div>
      </div>

      <div className="panel p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2 className="mt-2 text-2xl font-bold">Log in</h2>
          </div>
          <span className="grid size-11 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <LogIn size={20} aria-hidden="true" />
          </span>
        </div>

        {params.error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {params.error}
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <div className="space-y-2">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              defaultValue="admin@taskflow.dev"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              defaultValue="password123"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            <LogIn size={17} aria-hidden="true" />
            Log in
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          New here?{" "}
          <Link className="font-semibold text-emerald-700 dark:text-emerald-400" href="/register">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
