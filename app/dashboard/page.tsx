import Link from "next/link";
import {
  ArrowRight,
  Crown,
  FolderKanban,
  Layers3,
  ListTodo,
  Plus,
  Trash2
} from "lucide-react";
import { createProjectAction, deleteProjectAction } from "@/app/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FREE_PROJECT_LIMIT, isPremium } from "@/lib/subscription";

type DashboardPageProps = {
  searchParams?: Promise<{
    premium?: string;
    error?: string;
  }>;
};

const PROJECT_COLORS = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#d97706"];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : {};
  const premium = isPremium(user.subscription);

  const [projects, taskCount, completedTaskCount] = await Promise.all([
    db.project.findMany({
      where: {
        ownerId: user.id
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        },
        tasks: {
          orderBy: {
            updatedAt: "desc"
          },
          take: 3
        }
      }
    }),
    db.task.count({
      where: {
        project: {
          ownerId: user.id
        }
      }
    }),
    db.task.count({
      where: {
        status: "DONE",
        project: {
          ownerId: user.id
        }
      }
    })
  ]);

  const atProjectLimit = !premium && projects.length >= FREE_PROJECT_LIMIT;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="panel p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Workspace</p>
              <h1 className="mt-2 text-3xl font-bold">Good to see you, {user.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Projects, task movement, subscription state, and analytics events are all backed by SQLite.
              </p>
            </div>
            <Link className="secondary-button" href="/pricing">
              <Crown size={17} aria-hidden="true" />
              {premium ? "Manage plan" : "Upgrade"}
            </Link>
          </div>

          {params.premium === "upgraded" ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              Premium is active. Dark mode and unlimited projects are unlocked.
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <MetricCard icon={<Layers3 size={18} />} label="Projects" value={projects.length.toString()} />
          <MetricCard icon={<ListTodo size={18} />} label="Tasks" value={taskCount.toString()} />
          <MetricCard icon={<Crown size={18} />} label="Plan" value={premium ? "Premium" : "Free"} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">New project</p>
              <h2 className="mt-2 text-xl font-bold">Create workspace board</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Plus size={18} aria-hidden="true" />
            </span>
          </div>

          {atProjectLimit ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Free workspaces include {FREE_PROJECT_LIMIT} projects.
            </div>
          ) : null}

          <form action={createProjectAction} className="space-y-4">
            <div className="space-y-2">
              <label className="label" htmlFor="name">
                Project name
              </label>
              <input
                className="input"
                id="name"
                name="name"
                placeholder="Launch website"
                disabled={atProjectLimit}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="label" htmlFor="description">
                Description
              </label>
              <textarea
                className="input min-h-24 resize-none"
                id="description"
                name="description"
                placeholder="Campaign tasks, design reviews, and launch checklist"
                disabled={atProjectLimit}
              />
            </div>

            <div className="space-y-2">
              <label className="label" htmlFor="color">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  className="h-11 w-16 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
                  id="color"
                  name="color"
                  type="color"
                  defaultValue={PROJECT_COLORS[0]}
                  disabled={atProjectLimit}
                />
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <span
                      key={color}
                      className="size-7 rounded-full border border-white shadow"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {atProjectLimit ? (
              <Link className="primary-button w-full" href="/pricing">
                <Crown size={17} aria-hidden="true" />
                Unlock unlimited projects
              </Link>
            ) : (
              <SubmitButton className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                <Plus size={17} aria-hidden="true" />
                Create project
              </SubmitButton>
            )}
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Boards</p>
              <h2 className="mt-2 text-2xl font-bold">Projects</h2>
            </div>
            <span className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {completedTaskCount}/{taskCount} done
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="panel p-8 text-center">
              <FolderKanban className="mx-auto text-zinc-400" size={36} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold">No projects yet</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Create one to activate the funnel analytics.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {projects.map((project) => (
                <article key={project.id} className="panel overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: project.color }} />
                  <div className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold">{project.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          {project.description || "No description"}
                        </p>
                      </div>
                      <form action={deleteProjectAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <button className="icon-button" type="submit" title="Delete project">
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </form>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.tasks.length === 0 ? (
                        <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          Empty board
                        </span>
                      ) : (
                        project.tasks.map((task) => (
                          <span
                            key={task.id}
                            className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {task.title}
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        {project._count.tasks} tasks
                      </span>
                      <Link className="secondary-button" href={`/projects/${project.id}`}>
                        Open
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {icon}
        </span>
        <span className="text-right text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold">{value}</p>
    </div>
  );
}
