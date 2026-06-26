import Link from "next/link";
import { BarChart3, Check, Crown, Layers3, Moon, XCircle } from "lucide-react";
import {
  cancelPremiumAction,
  upgradeToPremiumAction
} from "@/app/actions/subscription";
import { PricingTracker } from "@/components/PricingTracker";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { FREE_PROJECT_LIMIT, isPremium, PREMIUM_PRICE } from "@/lib/subscription";

type PricingPageProps = {
  searchParams?: Promise<{
    error?: string;
    canceled?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const premium = isPremium(user.subscription);

  return (
    <div className="space-y-8">
      <PricingTracker />

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Plans</p>
          <h1 className="mt-2 text-3xl font-bold">TaskFlow pricing</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Upgrade events, cancellation events, and pricing attention signals feed the analytics dashboard.
          </p>
        </div>
        <Link className="secondary-button" href="/dashboard">
          Dashboard
        </Link>
      </section>

      {params.error === "project-limit" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          You reached the Free project limit. Premium unlocks unlimited projects.
        </div>
      ) : null}

      {params.canceled ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          Premium was canceled and churn metrics were updated.
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <article
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900"
          data-pricing-plan="free"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Free</p>
              <h2 className="mt-2 text-2xl font-bold">$0</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Layers3 size={20} aria-hidden="true" />
            </span>
          </div>

          <ul className="mt-6 space-y-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <Feature>Up to {FREE_PROJECT_LIMIT} projects</Feature>
            <Feature>Kanban task boards</Feature>
            <Feature>Signup and activation tracking</Feature>
          </ul>

          <div className="mt-8">
            {premium ? (
              <span className="secondary-button w-full">Available as fallback</span>
            ) : (
              <span className="secondary-button w-full">Current plan</span>
            )}
          </div>
        </article>

        <article
          className="rounded-lg border border-emerald-300 bg-white p-6 shadow-soft dark:border-emerald-800 dark:bg-zinc-900"
          data-pricing-plan="premium"
          tabIndex={0}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Premium</p>
              <h2 className="mt-2 text-2xl font-bold">${PREMIUM_PRICE}/mo</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Crown size={20} aria-hidden="true" />
            </span>
          </div>

          <ul className="mt-6 space-y-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <Feature>Unlimited projects</Feature>
            <Feature>
              <Moon size={16} aria-hidden="true" />
              Dark mode
            </Feature>
            <Feature>
              <BarChart3 size={16} aria-hidden="true" />
              Executive SaaS reporting
            </Feature>
          </ul>

          <div className="mt-8 space-y-3">
            {premium ? (
              <>
                <span className="primary-button w-full">
                  <Check size={17} aria-hidden="true" />
                  Premium active
                </span>
                <form action={cancelPremiumAction}>
                  <SubmitButton
                    pendingLabel="Canceling..."
                    className="w-full border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-zinc-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    <XCircle size={17} aria-hidden="true" />
                    Cancel premium
                  </SubmitButton>
                </form>
              </>
            ) : (
              <form action={upgradeToPremiumAction}>
                <SubmitButton
                  pendingLabel="Upgrading..."
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Crown size={17} aria-hidden="true" />
                  Upgrade to Premium
                </SubmitButton>
              </form>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <Check size={14} aria-hidden="true" />
      </span>
      <span className="inline-flex items-center gap-2">{children}</span>
    </li>
  );
}
