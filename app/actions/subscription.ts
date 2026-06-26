"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PREMIUM_PRICE } from "@/lib/subscription";

function nextMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}

export async function upgradeToPremiumAction() {
  const user = await requireUser();

  await trackEvent({
    event: "upgrade_clicked",
    userId: user.id,
    metadata: {
      plan: "premium",
      price: PREMIUM_PRICE
    }
  });

  await db.subscription.upsert({
    where: {
      userId: user.id
    },
    create: {
      userId: user.id,
      plan: "PREMIUM",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: nextMonth()
    },
    update: {
      plan: "PREMIUM",
      status: "ACTIVE",
      canceledAt: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: nextMonth()
    }
  });

  await trackEvent({
    event: "premium_started",
    userId: user.id,
    metadata: {
      plan: "premium",
      price: PREMIUM_PRICE
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  redirect("/dashboard?premium=upgraded");
}

export async function cancelPremiumAction() {
  const user = await requireUser();

  await db.subscription.updateMany({
    where: {
      userId: user.id,
      plan: "PREMIUM",
      status: "ACTIVE"
    },
    data: {
      status: "CANCELED",
      canceledAt: new Date()
    }
  });

  await trackEvent({
    event: "subscription_canceled",
    userId: user.id,
    metadata: {
      plan: "premium"
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  redirect("/pricing?canceled=1");
}
