export const TASK_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export function asTaskPriority(priority: string): TaskPriority {
  return TASK_PRIORITIES.includes(priority as TaskPriority)
    ? (priority as TaskPriority)
    : "MEDIUM";
}
