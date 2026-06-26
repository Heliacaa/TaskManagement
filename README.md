# TaskFlow SaaS MVP

TaskFlow is a portfolio-ready SaaS task manager inspired by Trello and Asana. It includes authentication, projects, kanban tasks, a mocked Premium plan, and a local analytics dashboard that tells a Looker/Mixpanel/Hotjar-style product story without external accounts.

## Features

- Email/password registration and login with signed cookie sessions
- Project CRUD with a Free plan limit of 3 projects
- Kanban task board with Backlog, To do, In progress, and Done columns
- Mock Premium upgrade and cancellation flow
- Premium unlocks unlimited projects and dark mode
- Local analytics events for signup, activation, pricing attention, upgrades, and churn
- Admin dashboard with active users, MRR, churn, funnel conversion, pricing attention, and recent events
- Seeded SQLite demo data for a useful first run

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite

## Local Setup

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin + Premium | `admin@taskflow.dev` | `password123` |
| Free user | `free@taskflow.dev` | `password123` |
| Premium user | `premium@taskflow.dev` | `password123` |
| Churned user | `churned@taskflow.dev` | `password123` |

## Product Analytics Story

This project does not require paid Looker, Mixpanel, or Hotjar accounts. Instead, it implements the same product analytics concepts locally so the full flow is reviewable from GitHub.

### Looker-style executive reporting

The `/admin/analytics` page acts like a SaaS BI dashboard:

- Active users: unique users with analytics activity in the last 30 days
- MRR: active Premium subscriptions multiplied by the demo monthly price
- Churn rate: canceled Premium subscriptions divided by active plus canceled Premium subscriptions
- Recent event stream: latest product and subscription events

These metrics are calculated in `lib/metrics.ts` from SQLite data created through Prisma.

### Mixpanel-style funnel analytics

The app instruments an activation funnel:

```text
signup_completed -> project_created -> task_created
```

Events are recorded when a user registers, creates a project, and creates a task. The admin dashboard shows user counts, conversion percentages, and drop-off between each funnel step.

### Hotjar-style pricing behavior analysis

The pricing page tracks behavioral signals similar to a lightweight heatmap/session analytics workflow:

- `pricing_viewed`: pricing page opened
- `pricing_plan_focused`: Free or Premium plan card hovered/focused, including duration in milliseconds
- `upgrade_clicked`: Premium CTA clicked

The client-side tracker in `components/PricingTracker.tsx` sends pricing interactions to `/api/analytics`, and `/admin/analytics` summarizes attention time and clicks per plan.

### Event tracking model

All product analytics events are stored in the `AnalyticsEvent` table:

- `signup_completed`
- `project_created`
- `task_created`
- `pricing_viewed`
- `pricing_plan_focused`
- `upgrade_clicked`
- `premium_started`
- `subscription_canceled`

This keeps the MVP self-contained while demonstrating event instrumentation, funnel analysis, subscription metrics, and pricing-page behavior analysis.

## Resume Talking Points

- Built a full-stack SaaS task management MVP with Next.js, TypeScript, Prisma, SQLite, and Tailwind CSS.
- Implemented local product analytics instrumentation modeled after Mixpanel events and activation funnels.
- Built an admin BI dashboard modeled after Looker to report active users, MRR, churn, funnel conversion, and event streams.
- Added Hotjar-style pricing behavior tracking for plan-card attention time and Premium CTA clicks.
- Designed a mocked Premium subscription flow with project limits, upgrade/cancel events, and seeded demo data.

## Key Routes

- `/login`
- `/register`
- `/dashboard`
- `/projects/[id]`
- `/pricing`
- `/admin/analytics`

## Screenshots

Add screenshots after running locally:

- Dashboard: `public/screenshots/dashboard.png`
- Kanban board: `public/screenshots/project-board.png`
- Pricing: `public/screenshots/pricing.png`
- Admin analytics: `public/screenshots/admin-analytics.png`

## Notes

This MVP intentionally mocks billing and external analytics tools. The goal is to demonstrate product thinking, SaaS mechanics, and event-driven reporting in a self-contained app that reviewers can run from GitHub.
