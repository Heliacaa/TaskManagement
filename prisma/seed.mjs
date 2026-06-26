import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function createProjectWithTasks({
  ownerId,
  name,
  description,
  color,
  tasks
}) {
  return prisma.project.create({
    data: {
      ownerId,
      name,
      description,
      color,
      tasks: {
        create: tasks.map((task) => ({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate:
            task.daysUntilDue === undefined
              ? undefined
              : daysAgo(-task.daysUntilDue)
        }))
      }
    }
  });
}

async function main() {
  await prisma.analyticsEvent.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("password123");

  const admin = await prisma.user.create({
    data: {
      name: "Maya Admin",
      email: "admin@taskflow.dev",
      passwordHash,
      isAdmin: true,
      subscription: {
        create: {
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: daysAgo(8),
          currentPeriodEnd: daysAgo(-22)
        }
      }
    }
  });

  const freeUser = await prisma.user.create({
    data: {
      name: "Nora Free",
      email: "free@taskflow.dev",
      passwordHash,
      subscription: {
        create: {
          plan: "FREE",
          status: "ACTIVE"
        }
      }
    }
  });

  const premiumUser = await prisma.user.create({
    data: {
      name: "Leo Premium",
      email: "premium@taskflow.dev",
      passwordHash,
      subscription: {
        create: {
          plan: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: daysAgo(13),
          currentPeriodEnd: daysAgo(-17)
        }
      }
    }
  });

  const churnedUser = await prisma.user.create({
    data: {
      name: "Iris Churned",
      email: "churned@taskflow.dev",
      passwordHash,
      subscription: {
        create: {
          plan: "PREMIUM",
          status: "CANCELED",
          currentPeriodStart: daysAgo(25),
          currentPeriodEnd: daysAgo(5),
          canceledAt: daysAgo(4)
        }
      }
    }
  });

  const adminProject = await createProjectWithTasks({
    ownerId: admin.id,
    name: "Recruiter demo launch",
    description: "Polish the SaaS story, screenshots, and analytics walkthrough.",
    color: "#059669",
    tasks: [
      {
        title: "Record dashboard walkthrough",
        description: "Show projects, premium upgrade, and admin analytics.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        daysUntilDue: 2
      },
      {
        title: "Capture README screenshots",
        description: "Add local screenshots after running the app.",
        status: "TODO",
        priority: "MEDIUM",
        daysUntilDue: 4
      },
      {
        title: "Seed demo data",
        description: "Make analytics useful on first run.",
        status: "DONE",
        priority: "HIGH"
      }
    ]
  });

  await createProjectWithTasks({
    ownerId: freeUser.id,
    name: "Website refresh",
    description: "Landing page tasks for the marketing team.",
    color: "#2563eb",
    tasks: [
      {
        title: "Review hero copy",
        description: "Shorten headline and CTA text.",
        status: "TODO",
        priority: "MEDIUM",
        daysUntilDue: 3
      },
      {
        title: "Prepare pricing FAQ",
        description: "Address plan limit questions.",
        status: "BACKLOG",
        priority: "LOW"
      }
    ]
  });

  await createProjectWithTasks({
    ownerId: premiumUser.id,
    name: "Product analytics sprint",
    description: "Instrument activation funnel and pricing interactions.",
    color: "#7c3aed",
    tasks: [
      {
        title: "Validate signup events",
        description: "Confirm signup_completed fires for new accounts.",
        status: "DONE",
        priority: "HIGH"
      },
      {
        title: "Tune funnel copy",
        description: "Make activation drop-off obvious in dashboard.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        daysUntilDue: 1
      },
      {
        title: "Analyze pricing card attention",
        description: "Compare Free and Premium hover/focus time.",
        status: "TODO",
        priority: "MEDIUM",
        daysUntilDue: 5
      }
    ]
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        event: "signup_completed",
        userId: admin.id,
        metadata: { source: "seed" },
        createdAt: daysAgo(21)
      },
      {
        event: "project_created",
        userId: admin.id,
        metadata: { projectId: adminProject.id },
        createdAt: daysAgo(20)
      },
      {
        event: "task_created",
        userId: admin.id,
        metadata: { projectId: adminProject.id },
        createdAt: daysAgo(19)
      },
      {
        event: "premium_started",
        userId: admin.id,
        metadata: { plan: "premium", price: 19 },
        createdAt: daysAgo(8)
      },
      {
        event: "signup_completed",
        userId: freeUser.id,
        metadata: { source: "seed" },
        createdAt: daysAgo(15)
      },
      {
        event: "project_created",
        userId: freeUser.id,
        metadata: { projectCount: 1 },
        createdAt: daysAgo(14)
      },
      {
        event: "task_created",
        userId: freeUser.id,
        metadata: { source: "seed" },
        createdAt: daysAgo(13)
      },
      {
        event: "pricing_viewed",
        userId: freeUser.id,
        metadata: { page: "pricing" },
        createdAt: daysAgo(3)
      },
      {
        event: "pricing_plan_focused",
        userId: freeUser.id,
        metadata: { plan: "premium", durationMs: 9200 },
        createdAt: daysAgo(3)
      },
      {
        event: "signup_completed",
        userId: premiumUser.id,
        metadata: { source: "seed" },
        createdAt: daysAgo(12)
      },
      {
        event: "project_created",
        userId: premiumUser.id,
        metadata: { projectCount: 1 },
        createdAt: daysAgo(11)
      },
      {
        event: "task_created",
        userId: premiumUser.id,
        metadata: { source: "seed" },
        createdAt: daysAgo(10)
      },
      {
        event: "pricing_viewed",
        userId: premiumUser.id,
        metadata: { page: "pricing" },
        createdAt: daysAgo(9)
      },
      {
        event: "upgrade_clicked",
        userId: premiumUser.id,
        metadata: { plan: "premium", price: 19 },
        createdAt: daysAgo(9)
      },
      {
        event: "premium_started",
        userId: premiumUser.id,
        metadata: { plan: "premium", price: 19 },
        createdAt: daysAgo(9)
      },
      {
        event: "signup_completed",
        userId: churnedUser.id,
        metadata: { source: "seed" },
        createdAt: daysAgo(28)
      },
      {
        event: "project_created",
        userId: churnedUser.id,
        metadata: { projectCount: 1 },
        createdAt: daysAgo(27)
      },
      {
        event: "pricing_viewed",
        userId: churnedUser.id,
        metadata: { page: "pricing" },
        createdAt: daysAgo(26)
      },
      {
        event: "pricing_plan_focused",
        userId: churnedUser.id,
        metadata: { plan: "free", durationMs: 3100 },
        createdAt: daysAgo(26)
      },
      {
        event: "subscription_canceled",
        userId: churnedUser.id,
        metadata: { plan: "premium" },
        createdAt: daysAgo(4)
      }
    ]
  });

  console.log("Seed complete");
  console.log("Demo login: admin@taskflow.dev / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
