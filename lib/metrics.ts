import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PREMIUM_PRICE } from "@/lib/subscription";
import { readMetadata } from "@/lib/analytics";

const FUNNEL_EVENTS = [
  "signup_completed",
  "project_created",
  "task_created"
] as const;

export async function getAdminAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeUsers = await db.analyticsEvent.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      },
      userId: {
        not: null
      }
    },
    distinct: ["userId"],
    select: {
      userId: true
    }
  });

  const activePremiumSubscriptions = await db.subscription.count({
    where: {
      plan: "PREMIUM",
      status: "ACTIVE"
    }
  });

  const canceledPremiumSubscriptions = await db.subscription.count({
    where: {
      plan: "PREMIUM",
      status: "CANCELED",
      canceledAt: {
        gte: thirtyDaysAgo
      }
    }
  });

  const churnBase = activePremiumSubscriptions + canceledPremiumSubscriptions;
  const churnRate =
    churnBase === 0 ? 0 : (canceledPremiumSubscriptions / churnBase) * 100;

  const funnelEvents = await db.analyticsEvent.findMany({
    where: {
      event: {
        in: [...FUNNEL_EVENTS]
      },
      userId: {
        not: null
      }
    },
    select: {
      event: true,
      userId: true
    }
  });

  const usersByEvent = FUNNEL_EVENTS.reduce<Record<string, Set<string>>>(
    (acc, event) => {
      acc[event] = new Set<string>();
      return acc;
    },
    {}
  );

  funnelEvents.forEach((event) => {
    if (event.userId && usersByEvent[event.event]) {
      usersByEvent[event.event].add(event.userId);
    }
  });

  const signupCount = usersByEvent.signup_completed.size;
  const funnel = [
    {
      label: "Sign up",
      event: "signup_completed",
      count: signupCount
    },
    {
      label: "Create first project",
      event: "project_created",
      count: usersByEvent.project_created.size
    },
    {
      label: "Add first task",
      event: "task_created",
      count: usersByEvent.task_created.size
    }
  ].map((step, index, steps) => {
    const previous = index === 0 ? step.count : steps[index - 1].count;
    const conversion = signupCount === 0 ? 0 : (step.count / signupCount) * 100;
    const dropOff =
      index === 0 || previous === 0 ? 0 : ((previous - step.count) / previous) * 100;

    return {
      ...step,
      conversion,
      dropOff
    };
  });

  const pricingEvents = await db.analyticsEvent.findMany({
    where: {
      event: {
        in: ["pricing_viewed", "pricing_plan_focused", "upgrade_clicked"]
      },
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const pricingPlans = new Map<
    string,
    { plan: string; attentionMs: number; clicks: number }
  >([
    ["free", { plan: "free", attentionMs: 0, clicks: 0 }],
    ["premium", { plan: "premium", attentionMs: 0, clicks: 0 }]
  ]);

  let pricingViews = 0;

  pricingEvents.forEach((event) => {
    const metadata = readMetadata(event.metadata as Prisma.JsonValue);
    const plan =
      typeof metadata.plan === "string" ? metadata.plan.toLowerCase() : null;

    if (event.event === "pricing_viewed") {
      pricingViews += 1;
    }

    if (!plan || !pricingPlans.has(plan)) {
      return;
    }

    const planMetrics = pricingPlans.get(plan)!;

    if (event.event === "pricing_plan_focused") {
      const durationMs =
        typeof metadata.durationMs === "number" ? metadata.durationMs : 0;
      planMetrics.attentionMs += durationMs;
    }

    if (event.event === "upgrade_clicked") {
      planMetrics.clicks += 1;
    }
  });

  const recentEvents = await db.analyticsEvent.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 12,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });

  return {
    executive: {
      activeUsers: activeUsers.length,
      mrr: activePremiumSubscriptions * PREMIUM_PRICE,
      churnRate,
      activePremiumSubscriptions,
      canceledPremiumSubscriptions
    },
    funnel,
    pricing: {
      views: pricingViews,
      plans: [...pricingPlans.values()]
    },
    recentEvents
  };
}
