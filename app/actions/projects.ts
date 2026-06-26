"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { FREE_PROJECT_LIMIT, isPremium } from "@/lib/subscription";

const projectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
});

const projectIdSchema = z.object({
  projectId: z.string().min(1)
});

export async function createProjectAction(formData: FormData) {
  const user = await requireUser();
  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || "#2563eb"
  });

  if (!parsed.success) {
    redirect("/dashboard?error=project-invalid");
  }

  const premium = isPremium(user.subscription);
  const projectCount = await db.project.count({
    where: {
      ownerId: user.id
    }
  });

  if (!premium && projectCount >= FREE_PROJECT_LIMIT) {
    redirect("/pricing?error=project-limit");
  }

  const project = await db.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      color: parsed.data.color,
      ownerId: user.id
    }
  });

  await trackEvent({
    event: "project_created",
    userId: user.id,
    metadata: {
      projectId: project.id,
      projectCount: projectCount + 1
    }
  });

  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUser();
  const parsed = projectIdSchema.safeParse({
    projectId: formData.get("projectId")
  });

  if (!parsed.success) {
    redirect("/dashboard");
  }

  await db.project.deleteMany({
    where: {
      id: parsed.data.projectId,
      ownerId: user.id
    }
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
