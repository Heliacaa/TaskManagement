import type { Subscription } from "@prisma/client";

export const PREMIUM_PRICE = 19;
export const FREE_PROJECT_LIMIT = 3;

export function isPremium(
  subscription?: Pick<Subscription, "plan" | "status"> | null
) {
  return subscription?.plan === "PREMIUM" && subscription.status === "ACTIVE";
}
