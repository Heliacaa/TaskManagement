import { BarChart3, Flame, MousePointerClick, TrendingDown, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/metrics";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const analytics = await getAdminAnalytics();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Admin analytics</p>
          <h1 className="mt-2 text-3xl font-bold">SaaS command center</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Local analytics events are shaped into Looker, Mixpanel, and Hotjar style views.
          </p>
        </div>
        <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Last 30 days
        </span>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          icon={<Users size={19} />}
          label="Active users"
          value={analytics.executive.activeUsers.toString()}
          detail="Users with recorded activity"
        />
        <AnalyticsCard
          icon={<BarChart3 size={19} />}
          label="MRR"
          value={currency.format(analytics.executive.mrr)}
          detail={`${analytics.executive.activePremiumSubscriptions} active premium`}
        />
        <AnalyticsCard
          icon={<TrendingDown size={19} />}
          label="Churn"
          value={`${analytics.executive.churnRate.toFixed(1)}%`}
          detail={`${analytics.executive.canceledPremiumSubscriptions} canceled premium`}
        />
        <AnalyticsCard
          icon={<MousePointerClick size={19} />}
          label="Pricing views"
          value={analytics.pricing.views.toString()}
          detail="Tracked on pricing page load"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel p-6">
          <div className="mb-6">
            <p className="eyebrow">Mixpanel funnel</p>
            <h2 className="mt-2 text-xl font-bold">Signup activation</h2>
          </div>

          <div className="space-y-5">
            {analytics.funnel.map((step) => (
              <div key={step.event} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{step.label}</span>
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {step.count} users · {step.conversion.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${Math.max(step.conversion, step.count > 0 ? 6 : 0)}%` }}
                  />
                </div>
                {step.dropOff > 0 ? (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {step.dropOff.toFixed(0)}% drop-off from previous step
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-6">
            <p className="eyebrow">Hotjar signal</p>
            <h2 className="mt-2 text-xl font-bold">Pricing attention</h2>
          </div>

          <div className="space-y-3">
            {analytics.pricing.plans.map((plan) => (
              <div
                key={plan.plan}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold capitalize">
                    <Flame size={16} aria-hidden="true" />
                    {plan.plan}
                  </span>
                  <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    {plan.clicks} clicks
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold">{formatDuration(plan.attentionMs)}</p>
                <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Total card focus and hover time
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
          <p className="eyebrow">Event stream</p>
          <h2 className="mt-2 text-xl font-bold">Recent analytics events</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {analytics.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 font-semibold">{event.event}</td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    {event.user?.email ?? "Anonymous"}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    {event.createdAt.toLocaleString("en", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AnalyticsCard({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {icon}
        </span>
        <span className="text-right text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${Math.round(ms / 1000)}s`;
}
