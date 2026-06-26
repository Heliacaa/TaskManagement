"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { trackEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/task-options";

const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().optional()
});

const statusSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  status: z.enum(TASK_STATUSES)
});

const deleteTaskSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1)
});

async function ensureProjectAccess(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId
    },
    select: {
      id: true
    }
  });

  if (!project) {
    redirect("/dashboard");
  }
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    dueDate: formData.get("dueDate") || undefined
  });

  if (!parsed.success) {
    redirect("/dashboard");
  }

  await ensureProjectAccess(parsed.data.projectId, user.id);

  const task = await db.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      projectId: parsed.data.projectId
    }
  });

  await trackEvent({
    event: "task_created",
    userId: user.id,
    metadata: {
      projectId: parsed.data.projectId,
      taskId: task.id
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  const parsed = statusSchema.safeParse({
    taskId: formData.get("taskId"),
    projectId: formData.get("projectId"),
    status: formData.get("status")
  });

  if (!parsed.success) {
    redirect("/dashboard");
  }

  await ensureProjectAccess(parsed.data.projectId, user.id);

  await db.task.updateMany({
    where: {
      id: parsed.data.taskId,
      projectId: parsed.data.projectId
    },
    data: {
      status: parsed.data.status
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = deleteTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    projectId: formData.get("projectId")
  });

  if (!parsed.success) {
    redirect("/dashboard");
  }

  await ensureProjectAccess(parsed.data.projectId, user.id);

  await db.task.deleteMany({
    where: {
      id: parsed.data.taskId,
      projectId: parsed.data.projectId
    }
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
}
