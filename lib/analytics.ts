import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { forwardToMixpanel, isMixpanelConfigured } from "@/lib/mixpanel";
import { isPremium } from "@/lib/subscription";

type TrackEventInput = {
  event: string;
  userId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function trackEvent({
  event,
  userId,
  metadata
}: TrackEventInput) {
  await db.analyticsEvent.create({
    data: {
      event,
      userId: userId ?? null,
      metadata
    }
  });

  if (!isMixpanelConfigured()) {
    return;
  }

  try {
    const user = userId
      ? await db.user.findUnique({
          where: {
            id: userId
          },
          select: {
            id: true,
            isAdmin: true,
            subscription: {
              select: {
                plan: true,
                status: true
              }
            }
          }
        })
      : null;

    await forwardToMixpanel({
      event,
      userId,
      metadata,
      user: user
        ? {
            id: user.id,
            plan: isPremium(user.subscription) ? "premium" : "free",
            isAdmin: user.isAdmin
          }
        : null
    });
  } catch (error) {
    console.warn("External analytics forwarding failed", error);
  }
}

export function readMetadata(
  metadata: Prisma.JsonValue
): Record<string, unknown> {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return {};
  }

  return metadata as Record<string, unknown>;
}
