import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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
}

export function readMetadata(
  metadata: Prisma.JsonValue
): Record<string, unknown> {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return {};
  }

  return metadata as Record<string, unknown>;
}
