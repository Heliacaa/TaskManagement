import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Plus,
  Trash2
} from "lucide-react";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskStatusAction
} from "@/app/actions/tasks";
import { SubmitButton } from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { asTaskPriority, type TaskPriority, type TaskStatus } from "@/lib/task-options";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const COLUMNS: Array<{ status: TaskStatus; label: string; icon: React.ReactNode }> = [
  { status: "BACKLOG", label: "Backlog", icon: <Circle size={17} /> },
  { status: "TODO", label: "To do", icon: <Clock3 size={17} /> },
  { status: "IN_PROGRESS", label: "In progress", icon: <ArrowRight size={17} /> },
  { status: "DONE", label: "Done", icon: <CheckCircle2 size={17} /> }
];

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  LOW: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900",
  MEDIUM:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
  HIGH: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const project = await db.project.findFirst({
    where: {
      id,
      ownerId: user.id
    },
    include: {
      tasks: {
        orderBy: [
          {
            status: "asc"
          },
          {
            updatedAt: "desc"
          }
        ]
      }
    }
  });

  if (!project) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
        <Link className="primary-button mt-5" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const doneCount = project.tasks.filter((task) => task.status === "DONE").length;

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden">
        <div className="h-2" style={{ backgroundColor: project.color }} />
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Dashboard
            </Link>
            <p className="eyebrow mt-5">Project board</p>
            <h1 className="mt-2 text-3xl font-bold">{project.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {project.description || "Tasks are grouped by status and update instantly through server actions."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tasks</p>
              <p className="mt-2 text-2xl font-bold">{project.tasks.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Done</p>
              <p className="mt-2 text-2xl font-bold">{doneCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Task intake</p>
              <h2 className="mt-2 text-xl font-bold">Add task</h2>
            </div>
            <span className="grid size-10 place-items-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Plus size={18} aria-hidden="true" />
            </span>
          </div>

          <form action={createTaskAction} className="space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="space-y-2">
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                className="input"
                id="title"
                name="title"
                placeholder="Review onboarding copy"
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
                placeholder="Owner, notes, or acceptance details"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="label" htmlFor="priority">
                  Priority
                </label>
                <select className="input" id="priority" name="priority" defaultValue="MEDIUM">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="label" htmlFor="dueDate">
                  Due date
                </label>
                <input className="input" id="dueDate" name="dueDate" type="date" />
              </div>
            </div>

            <SubmitButton className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus size={17} aria-hidden="true" />
              Add task
            </SubmitButton>
          </form>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const tasks = project.tasks.filter((task) => task.status === column.status);

            return (
              <section key={column.status} className="panel min-h-80 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                    {column.icon}
                    {column.label}
                  </h2>
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {tasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-800">
                      Empty
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold leading-6">{task.title}</h3>
                            {task.description ? (
                              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                {task.description}
                              </p>
                            ) : null}
                          </div>
                          <form action={deleteTaskAction}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <input type="hidden" name="projectId" value={project.id} />
                            <button className="icon-button size-9" type="submit" title="Delete task">
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </form>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${PRIORITY_CLASSES[asTaskPriority(task.priority)]}`}
                          >
                            {task.priority.toLowerCase()}
                          </span>
                          {task.dueDate ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              <CalendarDays size={13} aria-hidden="true" />
                              {task.dueDate.toLocaleDateString("en", {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                          <StatusMoveButton
                            taskId={task.id}
                            projectId={project.id}
                            currentStatus={task.status}
                            direction="previous"
                          />
                          <StatusMoveButton
                            taskId={task.id}
                            projectId={project.id}
                            currentStatus={task.status}
                            direction="next"
                          />
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatusMoveButton({
  taskId,
  projectId,
  currentStatus,
  direction
}: {
  taskId: string;
  projectId: string;
  currentStatus: string;
  direction: "previous" | "next";
}) {
  const currentIndex = COLUMNS.findIndex((column) => column.status === currentStatus);
  const targetIndex = direction === "previous" ? currentIndex - 1 : currentIndex + 1;
  const target = COLUMNS[targetIndex];

  if (!target) {
    return <span className="size-9" />;
  }

  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;

  return (
    <form action={updateTaskStatusAction}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="status" value={target.status} />
      <button className="icon-button size-9" type="submit" title={`Move to ${target.label}`}>
        <Icon size={15} aria-hidden="true" />
      </button>
    </form>
  );
}
