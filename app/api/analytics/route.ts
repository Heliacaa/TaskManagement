import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { getUserIdFromSessionToken, SESSION_COOKIE } from "@/lib/auth";

const analyticsSchema = z.object({
  event: z.enum(["pricing_viewed", "pricing_plan_focused", "upgrade_clicked"]),
  metadata: z.record(z.unknown()).optional()
});

export async function POST(request: NextRequest) {
  const payload = analyticsSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userId = getUserIdFromSessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  await trackEvent({
    event: payload.data.event,
    userId,
    metadata: (payload.data.metadata ?? {}) as Prisma.InputJsonObject
  });

  return NextResponse.json({ ok: true });
}
