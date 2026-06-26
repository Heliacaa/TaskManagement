import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "taskflow_session";

function sessionSecret() {
  return process.env.SESSION_SECRET ?? "taskflow-local-development-secret";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export function createSessionToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function getUserIdFromSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [userId, signature] = token.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expected = sign(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer) ? userId : null;
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = getUserIdFromSessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );

  if (!userId) {
    return null;
  }

  return db.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  return user;
}
