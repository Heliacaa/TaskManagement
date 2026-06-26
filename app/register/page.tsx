import Link from "next/link";
import { UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { getCurrentUser } from "@/lib/auth";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : {};

  return (
    <section className="mx-auto max-w-xl">
      <div className="panel p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Start free</p>
            <h1 className="mt-2 text-3xl font-bold">Create your TaskFlow workspace</h1>
          </div>
          <span className="grid size-11 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <UserPlus size={20} aria-hidden="true" />
          </span>
        </div>

        {params.error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {params.error}
          </div>
        ) : null}

        <form action={registerAction} className="space-y-4">
          <div className="space-y-2">
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              className="input"
              id="name"
              name="name"
              type="text"
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              placeholder="ada@example.com"
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
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          <SubmitButton className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
            <UserPlus size={17} aria-hidden="true" />
            Create account
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link className="font-semibold text-emerald-700 dark:text-emerald-400" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
