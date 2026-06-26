"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Password is required.")
});

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    errorRedirect("/register", parsed.error.errors[0]?.message ?? "Try again.");
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE"
          }
        }
      }
    });

    await trackEvent({
      event: "signup_completed",
      userId: user.id,
      metadata: {
        source: "app_register"
      }
    });

    await setSessionCookie(user.id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      errorRedirect("/register", "An account with this email already exists.");
    }

    errorRedirect("/register", "We could not create your account.");
  }

  redirect("/dashboard");
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    errorRedirect("/login", parsed.error.errors[0]?.message ?? "Try again.");
  }

  const user = await db.user.findUnique({
    where: {
      email: parsed.data.email.toLowerCase()
    }
  });

  if (!user) {
    errorRedirect("/login", "Email or password is incorrect.");
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    errorRedirect("/login", "Email or password is incorrect.");
  }

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
